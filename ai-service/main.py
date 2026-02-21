"""
AI Service — FastAPI microservice for difficulty calibration.
Endpoints:
  POST /train        — Train/retrain the model on current data
  POST /recommend    — Get recommended problem for a user
  GET  /health       — Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

from data_loader import (
    get_db,
    build_training_data,
    load_problems,
    load_users,
    load_submissions,
    compute_user_tag_strengths,
)
from model import DifficultyCalibrationModel

app = FastAPI(title="JudgeX AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model = DifficultyCalibrationModel()

# Try to load previously trained model on startup
model.load()


class RecommendRequest(BaseModel):
    username: str


class RecommendResponse(BaseModel):
    problem_id: str
    problem_name: str
    difficulty: str
    tags: list[str]
    predicted_score: float
    ac_rate: float


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_trained": model.is_trained,
    }


@app.post("/train")
async def train_model():
    """Train the difficulty calibration model on current submission data."""
    try:
        db = get_db()
        df = build_training_data(db)

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="No training data available. Need submissions in the database.",
            )

        metrics = model.train(df)

        if "error" in metrics:
            raise HTTPException(status_code=400, detail=metrics["error"])

        return {
            "success": True,
            "message": "Model trained successfully",
            "metrics": metrics,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend", response_model=RecommendResponse)
async def recommend_problem(request: RecommendRequest):
    """Get a recommended problem for a specific user."""
    if not model.is_trained:
        raise HTTPException(
            status_code=400,
            detail="Model not trained yet. Call POST /train first.",
        )

    try:
        db = get_db()
        username = request.username

        # Load user info
        users_df = load_users(db)
        user_row = users_df[users_df["name"] == username]

        if user_row.empty:
            raise HTTPException(status_code=404, detail=f"User '{username}' not found")

        user_info = user_row.iloc[0].to_dict()

        # Load problems
        problems_df = load_problems(db)
        if problems_df.empty:
            raise HTTPException(status_code=404, detail="No problems in database")

        # Get user's solved problems
        submissions_df = load_submissions(db)
        user_subs = submissions_df[submissions_df["author"] == username]
        solved_ids = set(
            user_subs[user_subs["solved"] == 1]["forProblem"].unique()
        )

        # Compute tag strengths for this user
        tag_strengths = compute_user_tag_strengths(
            user_subs, problems_df
        )
        user_tag_strength = tag_strengths.get(username, {})

        # Build candidate list
        candidates = []
        diff_names = {0: "easy", 1: "medium", 2: "hard"}

        for _, p in problems_df.iterrows():
            tags = p.get("tags", [])
            if not isinstance(tags, list):
                tags = []

            # Compute tag overlap strength
            if tags:
                tag_overlap = np.mean(
                    [user_tag_strength.get(tag, 0.0) for tag in tags]
                )
            else:
                tag_overlap = 0.0

            candidates.append({
                "id": p["id"],
                "name": p.get("name", ""),
                "difficulty": p.get("difficulty", "medium"),
                "difficulty_encoded": p.get("difficulty_encoded", 1),
                "ac_rate": p.get("ac_rate", 0.5),
                "tags": tags,
                "tag_overlap_strength": tag_overlap,
            })

        # Get recommendation
        user_features = {
            "user_total_ac": user_info.get("totalAC", 0),
            "user_total_attempts": user_info.get("totalAttempt", 0),
            "user_ac_rate": user_info.get("ac_rate", 0.0),
        }

        result = model.recommend_problem(user_features, candidates, solved_ids)

        if not result:
            raise HTTPException(
                status_code=404,
                detail="No suitable problem found for this user.",
            )

        return RecommendResponse(
            problem_id=result["id"],
            problem_name=result["name"],
            difficulty=result["difficulty"],
            tags=result.get("tags", []),
            predicted_score=result["predicted_score"],
            ac_rate=round(result.get("ac_rate", 0.5), 4),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
