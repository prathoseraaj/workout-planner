"""
exercise_db.py
==============
Exercise database with equipment encoded as bitmasks.

Equipment Bitmask Encoding:
  Bit 0 (1)  = Bodyweight (no equipment)
  Bit 1 (2)  = Dumbbells
  Bit 2 (4)  = Barbell
  Bit 3 (8)  = Pull-up Bar
  Bit 4 (16) = Resistance Bands
  Bit 5 (32) = Kettlebell
  Bit 6 (64) = Cable Machine
  Bit 7 (128)= Bench

Example:  Barbell Squat needs Barbell(4) + Bench optional → equipment_mask = 4
          Push-Up needs Bodyweight(1)                       → equipment_mask = 1
          Dumbbell Curl needs Dumbbells(2)                  → equipment_mask = 2
"""

from typing import List, Dict

# Each exercise maps to:
#   id, name, muscle_group, equipment_mask, calories, fatigue_cost, difficulty,
#   sets, reps_low, reps_high, rest_seconds, description
EXERCISE_DB: List[Dict] = [
    # ─── CHEST ────────────────────────────────────────────────────────────
    {
        "id": 1, "name": "Push-Up", "muscle_group": "Chest",
        "equipment_mask": 1,       # Bodyweight only
        "calories": 8, "fatigue_cost": 10, "difficulty": 1,
        "sets": 3, "reps_low": 10, "reps_high": 20, "rest_seconds": 60,
        "description": "Classic bodyweight chest exercise targeting pecs and triceps.",
        "neighbors": [2, 5]        # Graph edges
    },
    {
        "id": 2, "name": "Dumbbell Bench Press", "muscle_group": "Chest",
        "equipment_mask": 2 | 128, # Dumbbells + Bench
        "calories": 14, "fatigue_cost": 20, "difficulty": 2,
        "sets": 4, "reps_low": 8, "reps_high": 12, "rest_seconds": 90,
        "description": "Dumbbell press on bench for full chest activation with stabilizer muscles.",
        "neighbors": [1, 3, 5]
    },
    {
        "id": 3, "name": "Barbell Bench Press", "muscle_group": "Chest",
        "equipment_mask": 4 | 128, # Barbell + Bench
        "calories": 18, "fatigue_cost": 30, "difficulty": 3,
        "sets": 5, "reps_low": 3, "reps_high": 8, "rest_seconds": 180,
        "description": "King of chest exercises. Heavy compound movement for maximum strength.",
        "neighbors": [2, 6]
    },
    {
        "id": 4, "name": "Cable Fly", "muscle_group": "Chest",
        "equipment_mask": 64,      # Cable Machine
        "calories": 10, "fatigue_cost": 15, "difficulty": 2,
        "sets": 3, "reps_low": 12, "reps_high": 15, "rest_seconds": 60,
        "description": "Isolation cable fly for chest stretch and peak contraction.",
        "neighbors": [2, 3]
    },
    # ─── BACK ─────────────────────────────────────────────────────────────
    {
        "id": 5, "name": "Pull-Up", "muscle_group": "Back",
        "equipment_mask": 8,       # Pull-up Bar
        "calories": 12, "fatigue_cost": 22, "difficulty": 2,
        "sets": 3, "reps_low": 5, "reps_high": 12, "rest_seconds": 90,
        "description": "Upper body compound movement. Excellent for lats and biceps.",
        "neighbors": [1, 6, 7]
    },
    {
        "id": 6, "name": "Barbell Deadlift", "muscle_group": "Back",
        "equipment_mask": 4,       # Barbell
        "calories": 25, "fatigue_cost": 40, "difficulty": 3,
        "sets": 4, "reps_low": 3, "reps_high": 6, "rest_seconds": 240,
        "description": "The ultimate posterior chain builder. Requires strict form.",
        "neighbors": [5, 3, 17]
    },
    {
        "id": 7, "name": "Dumbbell Row", "muscle_group": "Back",
        "equipment_mask": 2,       # Dumbbells
        "calories": 13, "fatigue_cost": 18, "difficulty": 2,
        "sets": 3, "reps_low": 10, "reps_high": 14, "rest_seconds": 75,
        "description": "Unilateral back exercise for lats, rhomboids, and rear delts.",
        "neighbors": [5, 6]
    },
    {
        "id": 8, "name": "Resistance Band Row", "muscle_group": "Back",
        "equipment_mask": 16,      # Resistance Bands
        "calories": 8, "fatigue_cost": 12, "difficulty": 1,
        "sets": 3, "reps_low": 15, "reps_high": 20, "rest_seconds": 60,
        "description": "Band-anchored row for building pulling strength with minimal equipment.",
        "neighbors": [7, 5]
    },
    # ─── SHOULDERS ────────────────────────────────────────────────────────
    {
        "id": 9, "name": "Dumbbell Shoulder Press", "muscle_group": "Shoulders",
        "equipment_mask": 2,       # Dumbbells
        "calories": 12, "fatigue_cost": 18, "difficulty": 2,
        "sets": 3, "reps_low": 10, "reps_high": 12, "rest_seconds": 90,
        "description": "Seated or standing dumbbell overhead press for deltoid strength.",
        "neighbors": [10, 11]
    },
    {
        "id": 10, "name": "Barbell Overhead Press", "muscle_group": "Shoulders",
        "equipment_mask": 4,       # Barbell
        "calories": 16, "fatigue_cost": 28, "difficulty": 3,
        "sets": 4, "reps_low": 5, "reps_high": 8, "rest_seconds": 180,
        "description": "Standing press — the pinnacle compound shoulder movement.",
        "neighbors": [9, 3]
    },
    {
        "id": 11, "name": "Lateral Raise", "muscle_group": "Shoulders",
        "equipment_mask": 2 | 16,  # Dumbbells OR Resistance Bands
        "calories": 6, "fatigue_cost": 8, "difficulty": 1,
        "sets": 3, "reps_low": 15, "reps_high": 20, "rest_seconds": 45,
        "description": "Isolation for medial deltoid width. Light weight, high control.",
        "neighbors": [9, 12]
    },
    {
        "id": 12, "name": "Pike Push-Up", "muscle_group": "Shoulders",
        "equipment_mask": 1,       # Bodyweight
        "calories": 7, "fatigue_cost": 12, "difficulty": 1,
        "sets": 3, "reps_low": 10, "reps_high": 15, "rest_seconds": 60,
        "description": "Bodyweight overhead press substitute using pike position.",
        "neighbors": [1, 11]
    },
    # ─── LEGS ─────────────────────────────────────────────────────────────
    {
        "id": 13, "name": "Bodyweight Squat", "muscle_group": "Legs",
        "equipment_mask": 1,       # Bodyweight
        "calories": 8, "fatigue_cost": 12, "difficulty": 1,
        "sets": 3, "reps_low": 15, "reps_high": 25, "rest_seconds": 60,
        "description": "Fundamental lower body movement. Quads, glutes, and core.",
        "neighbors": [14, 15]
    },
    {
        "id": 14, "name": "Goblet Squat", "muscle_group": "Legs",
        "equipment_mask": 2 | 32,  # Dumbbells OR Kettlebell
        "calories": 12, "fatigue_cost": 20, "difficulty": 2,
        "sets": 3, "reps_low": 12, "reps_high": 15, "rest_seconds": 90,
        "description": "Loaded squat with weight held at chest. Great quad developer.",
        "neighbors": [13, 15]
    },
    {
        "id": 15, "name": "Barbell Back Squat", "muscle_group": "Legs",
        "equipment_mask": 4 | 128, # Barbell + Rack/Bench
        "calories": 22, "fatigue_cost": 38, "difficulty": 3,
        "sets": 5, "reps_low": 4, "reps_high": 8, "rest_seconds": 240,
        "description": "The king of all leg exercises. Maximum muscle and strength stimulus.",
        "neighbors": [14, 6, 16]
    },
    {
        "id": 16, "name": "Romanian Deadlift", "muscle_group": "Legs",
        "equipment_mask": 2 | 4,   # Dumbbells OR Barbell
        "calories": 15, "fatigue_cost": 25, "difficulty": 2,
        "sets": 3, "reps_low": 10, "reps_high": 12, "rest_seconds": 120,
        "description": "Hip-hinge movement targeting hamstrings and glutes.",
        "neighbors": [15, 6]
    },
    {
        "id": 17, "name": "Kettlebell Swing", "muscle_group": "Legs",
        "equipment_mask": 32,      # Kettlebell
        "calories": 20, "fatigue_cost": 28, "difficulty": 2,
        "sets": 4, "reps_low": 15, "reps_high": 20, "rest_seconds": 90,
        "description": "Explosive hip hinge for posterior chain power and conditioning.",
        "neighbors": [6, 16]
    },
    # ─── CORE ─────────────────────────────────────────────────────────────
    {
        "id": 18, "name": "Plank", "muscle_group": "Core",
        "equipment_mask": 1,       # Bodyweight
        "calories": 5, "fatigue_cost": 8, "difficulty": 1,
        "sets": 3, "reps_low": 30, "reps_high": 60, "rest_seconds": 45,
        "description": "Isometric core stabilizer. Time-based instead of reps.",
        "neighbors": [19, 20]
    },
    {
        "id": 19, "name": "Hanging Leg Raise", "muscle_group": "Core",
        "equipment_mask": 8,       # Pull-up Bar
        "calories": 8, "fatigue_cost": 15, "difficulty": 2,
        "sets": 3, "reps_low": 10, "reps_high": 15, "rest_seconds": 60,
        "description": "Advanced core exercise targeting lower abs while hanging.",
        "neighbors": [5, 18]
    },
    {
        "id": 20, "name": "Ab Wheel Rollout", "muscle_group": "Core",
        "equipment_mask": 1,       # Bodyweight (treat wheel as bodyweight variant)
        "calories": 6, "fatigue_cost": 14, "difficulty": 2,
        "sets": 3, "reps_low": 8, "reps_high": 12, "rest_seconds": 60,
        "description": "Full extension core movement for serious anti-extension strength.",
        "neighbors": [18, 19]
    },
    # ─── ARMS ─────────────────────────────────────────────────────────────
    {
        "id": 21, "name": "Bicep Curl", "muscle_group": "Arms",
        "equipment_mask": 2,       # Dumbbells
        "calories": 6, "fatigue_cost": 10, "difficulty": 1,
        "sets": 3, "reps_low": 12, "reps_high": 15, "rest_seconds": 60,
        "description": "Classic dumbbell curl for bicep hypertrophy.",
        "neighbors": [22, 5]
    },
    {
        "id": 22, "name": "Tricep Dip", "muscle_group": "Arms",
        "equipment_mask": 1 | 128, # Bodyweight (+ optional bench)
        "calories": 8, "fatigue_cost": 14, "difficulty": 2,
        "sets": 3, "reps_low": 10, "reps_high": 15, "rest_seconds": 60,
        "description": "Bodyweight tricep exercise using parallel bars or bench edge.",
        "neighbors": [1, 21]
    },
    {
        "id": 23, "name": "Barbell Curl", "muscle_group": "Arms",
        "equipment_mask": 4,       # Barbell
        "calories": 8, "fatigue_cost": 14, "difficulty": 2,
        "sets": 4, "reps_low": 8, "reps_high": 12, "rest_seconds": 75,
        "description": "Bilateral barbell curl for maximum bicep loading.",
        "neighbors": [21, 10]
    },
    # ─── CARDIO ───────────────────────────────────────────────────────────
    {
        "id": 24, "name": "Burpee", "muscle_group": "Cardio",
        "equipment_mask": 1,       # Bodyweight
        "calories": 15, "fatigue_cost": 20, "difficulty": 2,
        "sets": 4, "reps_low": 10, "reps_high": 15, "rest_seconds": 60,
        "description": "Full-body cardio movement combining squat, push-up, and jump.",
        "neighbors": [1, 13, 18]
    },
    {
        "id": 25, "name": "Jump Rope", "muscle_group": "Cardio",
        "equipment_mask": 1,       # Bodyweight (rope counts as bodyweight variant)
        "calories": 12, "fatigue_cost": 15, "difficulty": 1,
        "sets": 3, "reps_low": 60, "reps_high": 120, "rest_seconds": 60,
        "description": "Skipping rope cardio for conditioning and calorie burn.",
        "neighbors": [24]
    },
]

# Quick lookup by id
EXERCISE_MAP: Dict[int, Dict] = {ex["id"]: ex for ex in EXERCISE_DB}
