"""
main.py  —  FastAPI backend for the Personal FitDSA Workout Planner
===================================================================
Single-user personal app.

Routes:
  GET  /user/exists       → check if user has set up their profile
  GET  /user              → get current user profile
  POST /user/setup        → create / update user profile
  POST /generate          → generate personalised workout plan
  GET  /history           → get workout history
  GET  /exercises         → full exercise database
  GET  /debug/bitmask     → show computed bitmask details
"""

import math
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

import storage
from exercise_db import EXERCISE_DB
from dsa_engine import (
    generate_workout_plan, WorkoutHistory,
    ExerciseGraph, equipment_to_mask, bitmask_filter, mask_to_equipment
)

app = FastAPI(
    title="FitDSA Personal Workout Planner",
    description="Personalized workout planning using Bitmask, Knapsack DP, Graph BFS, and in-memory storage",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialize on startup ──────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    print("[FitDSA] In-memory storage initialized ✓")


# ── Pydantic Models ────────────────────────────────────────────────────────

class UserSetup(BaseModel):
    name: str
    age: int
    weight_kg: float
    height_cm: float
    gender: str                  # "male" | "female" | "other"
    fitness_level: str           # "beginner" | "intermediate" | "advanced"
    goal: str                    # "weight_loss" | "muscle_gain" | "endurance" | "strength"
    available_minutes: int
    equipment: List[str]         # ["bodyweight", "dumbbells", ...]
    target_muscles: List[str]    # ["Chest", "Back", ...]


class GenerateRequest(BaseModel):
    custom_muscles: Optional[List[str]] = None


# ── Helper: BMI + calorie needs ────────────────────────────────────────────

def compute_body_stats(user: dict) -> dict:
    """
    Compute derived health stats from user's body measurements.
    BMI formula: weight(kg) / height(m)^2
    TDEE: Mifflin-St Jeor equation
    """
    h_m = user["height_cm"] / 100
    bmi = round(user["weight_kg"] / (h_m ** 2), 1)
    bmi_category = (
        "Underweight" if bmi < 18.5 else
        "Normal"      if bmi < 25.0 else
        "Overweight"  if bmi < 30.0 else
        "Obese"
    )

    # Mifflin-St Jeor BMR
    if user["gender"] == "male":
        bmr = 10 * user["weight_kg"] + 6.25 * user["height_cm"] - 5 * user["age"] + 5
    else:
        bmr = 10 * user["weight_kg"] + 6.25 * user["height_cm"] - 5 * user["age"] - 161

    activity_multipliers = {
        "beginner":     1.375,
        "intermediate": 1.55,
        "advanced":     1.725,
    }
    tdee = round(bmr * activity_multipliers.get(user["fitness_level"], 1.55))

    # Ideal weight (Devine formula)
    if user["gender"] == "male":
        ideal_weight = 50 + 2.3 * ((user["height_cm"] / 2.54) - 60)
    else:
        ideal_weight = 45.5 + 2.3 * ((user["height_cm"] / 2.54) - 60)

    return {
        "bmi": bmi,
        "bmi_category": bmi_category,
        "bmr": round(bmr),
        "tdee": tdee,
        "ideal_weight_kg": round(max(ideal_weight, 40), 1),
        "weight_to_goal_kg": round(user["weight_kg"] - max(ideal_weight, 40), 1),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def health():
    return {
        "status": "FitDSA Personal Workout Planner running",
        "version": "2.0.0 — In-Memory Single-User",
        "algorithms": [
            "Bitmask Filtering O(n)",
            "Bounded Knapsack DP O(n×W)",
            "Exercise Graph BFS O(V+E)",
            "In-Memory Storage O(1)",
        ],
    }


@app.get("/user/exists")
def user_exists():
    """Frontend checks this on load to decide: show onboarding or dashboard."""
    return {"exists": storage.user_exists()}


@app.get("/user")
def get_user():
    user = storage.get_user_profile()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found. Please complete setup.")
    stats = compute_body_stats(user)
    mask = user["equipment_mask"]
    compatible_count = len(bitmask_filter(EXERCISE_DB, mask))

    # Parse JSON strings back to lists for the frontend
    equipment = json.loads(user["equipment_list"]) if isinstance(user.get("equipment_list"), str) else user.get("equipment_list", [])
    target_muscles = json.loads(user["target_muscles"]) if isinstance(user.get("target_muscles"), str) else user.get("target_muscles", [])

    return {
        **user,
        "equipment": equipment,
        "target_muscles": target_muscles,
        "body_stats": stats,
        "equipment_binary": bin(mask),
        "compatible_exercises": compatible_count,
    }


@app.post("/user/setup")
def setup_user(req: UserSetup):
    """
    Save/update user profile.
    Computes equipment bitmask here so DSA engine gets an integer, not a list.
    """
    mask = equipment_to_mask(req.equipment)
    user_data = {
        "name":             req.name,
        "age":              req.age,
        "weight_kg":        req.weight_kg,
        "height_cm":        req.height_cm,
        "gender":           req.gender,
        "fitness_level":    req.fitness_level,
        "goal":             req.goal,
        "available_minutes": req.available_minutes,
        "equipment_mask":   mask,
        "equipment_list":   json.dumps(req.equipment),
        "target_muscles":   json.dumps(req.target_muscles),
    }

    saved = storage.save_user_profile(user_data)
    stats = compute_body_stats(saved)
    return {
        "status": "Profile saved",
        "user": {
            **saved,
            "equipment": req.equipment,
            "target_muscles": req.target_muscles,
            "body_stats": stats,
            "compatible_exercises": len(bitmask_filter(EXERCISE_DB, mask)),
        },
        "equipment_mask": mask,
        "equipment_binary": bin(mask),
    }


@app.post("/generate")
def generate_workout(req: GenerateRequest = None):
    """
    Main DSA pipeline:
    1. Bitmask filter    → O(n)
    2. Knapsack DP       → O(n × W)
    3. Graph BFS         → O(V + E)
    """
    user = storage.get_user_profile()
    if not user:
        raise HTTPException(status_code=404, detail="Please complete your profile setup first.")

    # Override target muscles if caller specified custom ones
    target_muscles = json.loads(user["target_muscles"])
    effective_muscles = (req.custom_muscles if req and req.custom_muscles else target_muscles)

    # Build profile dict for the DSA engine
    equipment_list = json.loads(user["equipment_list"])
    user_profile = {
        "id":               "me",
        "equipment":        equipment_list,
        "available_minutes": user["available_minutes"],
        "fitness_level":    user["fitness_level"],
        "target_muscles":   effective_muscles,
    }

    result = generate_workout_plan(
        all_exercises=EXERCISE_DB,
        user_profile=user_profile,
        history=WorkoutHistory(),
    )

    # Store in history
    storage.add_workout_to_history(result)

    # Attach user's body stats for UI display
    body_stats = compute_body_stats(user)
    result["user"] = {
        "name":        user["name"],
        "fitness_level": user["fitness_level"],
        "available_minutes": user["available_minutes"],
        "body_stats":  body_stats,
    }

    return result


@app.get("/history")
def get_history():
    """Return full workout history from memory."""
    sessions = storage.get_workout_history()
    return {
        "sessions": sessions,
        "total_workouts": len(sessions),
    }


@app.get("/exercises")
def get_exercises():
    user = storage.get_user_profile()
    mask = user["equipment_mask"] if user else 0
    result = []
    for ex in EXERCISE_DB:
        compatible = (ex["equipment_mask"] & mask) == ex["equipment_mask"] if mask else False
        result.append({
            **ex,
            "equipment_names": mask_to_equipment(ex["equipment_mask"]),
            "equipment_binary": bin(ex["equipment_mask"]),
            "compatible_with_your_equipment": compatible,
        })
    return {"exercises": result, "total": len(result)}


@app.get("/debug/bitmask")
def debug_bitmask():
    user = storage.get_user_profile()
    if not user:
        return {"error": "No user profile found"}
    mask = user["equipment_mask"]
    equipment_list = json.loads(user["equipment_list"])
    compatible = bitmask_filter(EXERCISE_DB, mask)
    return {
        "user": user["name"],
        "equipment_list": equipment_list,
        "mask_decimal": mask,
        "mask_binary": bin(mask),
        "compatible_exercises": [ex["name"] for ex in compatible],
        "count": len(compatible),
        "incompatible_exercises": [
            ex["name"] for ex in EXERCISE_DB
            if (ex["equipment_mask"] & mask) != ex["equipment_mask"]
        ],
    }
