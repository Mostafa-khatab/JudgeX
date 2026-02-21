"""
Difficulty Calibration Model — IRT-based model using Logistic Regression.

Predicts P(solve) for a given (user, problem) pair.
Selects problems in the "sweet spot" range (60-75% solve probability).
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

MODEL_PATH = os.path.join(os.path.dirname(__file__), "trained_model.pkl")

FEATURE_COLUMNS = [
    "user_total_ac",
    "user_total_attempts",
    "user_ac_rate",
    "problem_difficulty",
    "problem_ac_rate",
    "tag_overlap_strength",
]

# Sweet-spot range for difficulty calibration
SWEET_SPOT_MIN = 0.60
SWEET_SPOT_MAX = 0.75


class DifficultyCalibrationModel:
    """IRT-inspired difficulty calibration model."""

    def __init__(self):
        self.pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(
                C=1.0,
                max_iter=1000,
                class_weight="balanced",
                random_state=42,
            )),
        ])
        self.is_trained = False

    def train(self, df: pd.DataFrame) -> dict:
        """
        Train the model on the feature matrix.
        Returns training metrics.
        """
        if df.empty or len(df) < 10:
            return {"error": "Not enough data to train (need at least 10 samples)"}

        X = df[FEATURE_COLUMNS].values
        y = df["solved"].values

        # Split for evaluation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if len(set(y)) > 1 else None
        )

        self.pipeline.fit(X_train, y_train)
        self.is_trained = True

        # Evaluate
        train_acc = self.pipeline.score(X_train, y_train)
        test_acc = self.pipeline.score(X_test, y_test)

        # Save model
        joblib.dump(self.pipeline, MODEL_PATH)

        return {
            "status": "success",
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "train_accuracy": round(train_acc, 4),
            "test_accuracy": round(test_acc, 4),
        }

    def load(self) -> bool:
        """Load a previously trained model from disk."""
        if os.path.exists(MODEL_PATH):
            self.pipeline = joblib.load(MODEL_PATH)
            self.is_trained = True
            return True
        return False

    def predict_solve_probability(self, features: np.ndarray) -> np.ndarray:
        """
        Predict P(solve) for one or more (user, problem) pairs.
        features shape: (n_samples, n_features)
        """
        if not self.is_trained:
            raise RuntimeError("Model is not trained yet. Call /train first.")
        return self.pipeline.predict_proba(features)[:, 1]

    def recommend_problem(
        self,
        user_features: dict,
        candidate_problems: list[dict],
        solved_problem_ids: set,
    ) -> dict | None:
        """
        Find the best problem for a user from the candidate list.
        Returns the problem closest to the sweet spot.
        """
        if not self.is_trained or not candidate_problems:
            return None

        # Filter out already-solved problems
        unsolved = [p for p in candidate_problems if p["id"] not in solved_problem_ids]

        if not unsolved:
            return None

        # Build feature matrix for all candidate problems
        features = []
        for problem in unsolved:
            features.append([
                user_features.get("user_total_ac", 0),
                user_features.get("user_total_attempts", 0),
                user_features.get("user_ac_rate", 0.0),
                problem.get("difficulty_encoded", 1),
                problem.get("ac_rate", 0.5),
                problem.get("tag_overlap_strength", 0.0),
            ])

        features = np.array(features)
        probabilities = self.predict_solve_probability(features)

        # Find problems in sweet spot
        sweet_spot_target = (SWEET_SPOT_MIN + SWEET_SPOT_MAX) / 2
        best_idx = None
        best_distance = float("inf")

        for i, prob in enumerate(probabilities):
            distance = abs(prob - sweet_spot_target)
            if distance < best_distance:
                best_distance = distance
                best_idx = i

        if best_idx is not None:
            recommended = unsolved[best_idx]
            recommended["predicted_score"] = round(float(probabilities[best_idx]), 4)
            return recommended

        return None
