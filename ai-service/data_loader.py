"""
Data Loader — Extracts submission and problem data from MongoDB
and transforms it into features for the difficulty calibration model.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
import numpy as np

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/judgex")


def get_db():
    """Get MongoDB database connection."""
    client = MongoClient(MONGO_URI)
    db_name = MONGO_URI.rsplit("/", 1)[-1].split("?")[0]
    return client[db_name]


def load_submissions(db) -> pd.DataFrame:
    """Load all submissions from MongoDB."""
    submissions = list(
        db.submissions.find(
            {"status": {"$in": ["AC", "WA", "TLE", "MLE", "RTE", "CE"]}},
            {
                "author": 1,
                "forProblem": 1,
                "language": 1,
                "status": 1,
                "time": 1,
                "memory": 1,
                "createdAt": 1,
            },
        )
    )
    if not submissions:
        return pd.DataFrame()
    df = pd.DataFrame(submissions)
    df["solved"] = (df["status"] == "AC").astype(int)
    return df


def load_problems(db) -> pd.DataFrame:
    """Load all problems from MongoDB."""
    problems = list(
        db.problems.find(
            {},
            {
                "id": 1,
                "name": 1,
                "tags": 1,
                "difficulty": 1,
                "noOfSubm": 1,
                "noOfSuccess": 1,
            },
        )
    )
    if not problems:
        return pd.DataFrame()
    df = pd.DataFrame(problems)
    df["ac_rate"] = np.where(
        df["noOfSubm"] > 0, df["noOfSuccess"] / df["noOfSubm"], 0.5
    )
    diff_map = {"easy": 0, "medium": 1, "hard": 2}
    df["difficulty_encoded"] = df["difficulty"].map(diff_map).fillna(1)
    return df


def load_users(db) -> pd.DataFrame:
    """Load user statistics from MongoDB."""
    users = list(
        db.users.find(
            {},
            {
                "name": 1,
                "totalScore": 1,
                "totalAC": 1,
                "totalAttempt": 1,
            },
        )
    )
    if not users:
        return pd.DataFrame()
    df = pd.DataFrame(users)
    df["ac_rate"] = np.where(
        df["totalAttempt"] > 0, df["totalAC"] / df["totalAttempt"], 0.0
    )
    return df


def compute_user_tag_strengths(submissions_df: pd.DataFrame, problems_df: pd.DataFrame) -> dict:
    """
    Compute per-user per-tag success rate.
    Returns: { username: { tag: success_rate, ... }, ... }
    """
    if submissions_df.empty or problems_df.empty:
        return {}

    # Map problem_id to tags
    problem_tags = {}
    for _, row in problems_df.iterrows():
        tags = row.get("tags", [])
        if isinstance(tags, list):
            problem_tags[row["id"]] = tags

    tag_stats = {}  # { user: { tag: { solved: 0, total: 0 } } }

    for _, sub in submissions_df.iterrows():
        user = sub["author"]
        problem_id = sub["forProblem"]
        solved = sub["solved"]

        tags = problem_tags.get(problem_id, [])

        if user not in tag_stats:
            tag_stats[user] = {}

        for tag in tags:
            if tag not in tag_stats[user]:
                tag_stats[user][tag] = {"solved": 0, "total": 0}
            tag_stats[user][tag]["total"] += 1
            tag_stats[user][tag]["solved"] += solved

    # Convert to strength ratios
    strengths = {}
    for user, tags in tag_stats.items():
        strengths[user] = {}
        for tag, stats in tags.items():
            strengths[user][tag] = (
                stats["solved"] / stats["total"] if stats["total"] > 0 else 0.0
            )

    return strengths


def build_training_data(db) -> pd.DataFrame:
    """
    Build the feature matrix for model training.
    Each row = one (user, problem) pair with features and label.
    """
    submissions_df = load_submissions(db)
    problems_df = load_problems(db)
    users_df = load_users(db)

    if submissions_df.empty or problems_df.empty or users_df.empty:
        return pd.DataFrame()

    tag_strengths = compute_user_tag_strengths(submissions_df, problems_df)

    # Aggregate submissions: for each (user, problem), did they ever solve it?
    grouped = (
        submissions_df.groupby(["author", "forProblem"])
        .agg(
            solved=("solved", "max"),  # 1 if ever AC
            attempts=("solved", "count"),
        )
        .reset_index()
    )

    # Build features
    records = []
    problems_dict = problems_df.set_index("id").to_dict("index")
    users_dict = users_df.set_index("name").to_dict("index")

    for _, row in grouped.iterrows():
        user_name = row["author"]
        problem_id = row["forProblem"]

        user_info = users_dict.get(user_name, {})
        problem_info = problems_dict.get(problem_id, {})

        if not user_info or not problem_info:
            continue

        # Compute tag overlap strength
        problem_tags = problem_info.get("tags", [])
        user_tags = tag_strengths.get(user_name, {})
        if problem_tags and isinstance(problem_tags, list):
            tag_overlap = np.mean(
                [user_tags.get(tag, 0.0) for tag in problem_tags]
            ) if problem_tags else 0.0
        else:
            tag_overlap = 0.0

        records.append(
            {
                "user": user_name,
                "problem": problem_id,
                "user_total_ac": user_info.get("totalAC", 0),
                "user_total_attempts": user_info.get("totalAttempt", 0),
                "user_ac_rate": user_info.get("ac_rate", 0.0),
                "problem_difficulty": problem_info.get("difficulty_encoded", 1),
                "problem_ac_rate": problem_info.get("ac_rate", 0.5),
                "tag_overlap_strength": tag_overlap,
                "attempts": row["attempts"],
                "solved": row["solved"],
            }
        )

    return pd.DataFrame(records)
