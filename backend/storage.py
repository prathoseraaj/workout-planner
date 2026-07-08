"""
storage.py
==========
In-memory storage for FitDSA - single user personal app.

No database needed. Everything stored as Python objects:
  - User profile (onboarding data)
  - Workout history (generated plans)
"""

from typing import Optional, List, Dict
from datetime import datetime

# ── In-Memory Storage ──────────────────────────────────────────────────────
USER_PROFILE: Optional[Dict] = None
WORKOUT_HISTORY: List[Dict] = []


def user_exists() -> bool:
    """Check if user has set up their profile."""
    return USER_PROFILE is not None


def save_user_profile(user_data: Dict) -> Dict:
    """Save user profile to memory."""
    global USER_PROFILE
    USER_PROFILE = {
        **user_data,
        "created_at": USER_PROFILE.get("created_at") if USER_PROFILE else datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    return USER_PROFILE


def get_user_profile() -> Optional[Dict]:
    """Retrieve user profile from memory."""
    return USER_PROFILE


def add_workout_to_history(workout: Dict) -> Dict:
    """Add generated workout to history."""
    workout_entry = {
        "id": len(WORKOUT_HISTORY) + 1,
        "generated_at": datetime.now().isoformat(),
        **workout,
    }
    WORKOUT_HISTORY.append(workout_entry)
    return workout_entry


def get_workout_history() -> List[Dict]:
    """Get all workouts from history."""
    return WORKOUT_HISTORY


def clear_all():
    """Clear all data (for testing/reset)."""
    global USER_PROFILE, WORKOUT_HISTORY
    USER_PROFILE = None
    WORKOUT_HISTORY = []
