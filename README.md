# FitDSA — AI Workout Planner

> A personalized, full-stack workout planning application powered by a 4-stage algorithmic pipeline. Built with **React + Vite** on the frontend and **FastAPI (Python)** on the backend.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [How It Works](#how-it-works)
6. [API Reference](#api-reference)
7. [Onboarding Flow](#onboarding-flow)
8. [Algorithm Pipeline](#algorithm-pipeline)

---

## Overview

FitDSA generates a personalized, optimized workout plan for a single user based on their profile: available equipment, fitness level, session time, and target muscle groups.

Every time you click **"Generate Workout"**, the backend runs a 4-stage pipeline:

1. **Bitmask Filter** — Removes exercises incompatible with your equipment in O(n)
2. **HashMap History Lookup** — Penalizes yesterday's exercises to ensure variety in O(1)
3. **Knapsack DP** — Selects the highest-value set of exercises that fits your time budget in O(n × W)
4. **Graph BFS** — Orders selected exercises into a logical, structured session in O(V + E)

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, Vite 8, React Router, Recharts, react-icons, Framer Motion |
| Backend   | FastAPI, Uvicorn, Pydantic              |
| Styling   | Vanilla CSS (premium dark design system)|
| Storage   | In-memory (Python dict) — no database  |
| Fonts     | Inter, JetBrains Mono (Google Fonts)   |

---

## Project Structure

```
workout-planner/
├── backend/
│   ├── main.py           # FastAPI routes
│   ├── dsa_engine.py     # 4-stage algorithm pipeline
│   ├── exercise_db.py    # Exercise database (25 exercises)
│   ├── storage.py        # In-memory user + history storage
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Root: navbar, routing, onboarding check
│   │   ├── api.js            # Axios API client
│   │   ├── components/
│   │   │   ├── Onboarding.jsx   # 4-step onboarding form
│   │   │   ├── Onboarding.css
│   │   │   ├── Dashboard.jsx    # Main dashboard + workout display
│   │   │   ├── Dashboard.css
│   │   │   ├── DSATrace.jsx     # Algorithm trace visualizer
│   │   │   └── DSATrace.css
│   │   └── index.css            # Global design system tokens
│   ├── index.html
│   └── vite.config.js           # Dev server on :3000, proxy to :8000
│
└── DSA_REFERENCE.md      # Deep-dive into all 4 algorithms
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at → **http://localhost:8000**
Interactive API docs → **http://localhost:8000/docs**

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → **http://localhost:3000**

> The Vite dev server proxies all `/api/*` requests to `http://localhost:8000` automatically.

---

## How It Works

### First Visit — Onboarding

On first load, the app checks `GET /user/exists`. If no profile is found, a 4-step onboarding form is shown:

| Step | What It Captures |
|------|-----------------|
| 1. About You | Name, age, weight, height, gender |
| 2. Fitness Profile | Level (Beginner/Intermediate/Advanced), goal, session duration |
| 3. Equipment | What gym equipment you have access to |
| 4. Target Muscles | Which muscle groups to prioritize |

After submission, the app navigates directly to the **Dashboard**.

### Dashboard

- Click **Generate Workout** to run the pipeline
- View the generated plan with exercise cards (sets, reps, rest, calories)
- Switch to **Algorithm Trace** tab to see step-by-step pipeline output
- View **History** tab for past sessions

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user/exists` | Check if user profile exists |
| `GET` | `/user` | Get current user profile + body stats |
| `POST` | `/user/setup` | Create/update user profile |
| `POST` | `/generate` | Run the DSA pipeline and return a workout plan |
| `GET` | `/history` | Get all past workout sessions |
| `GET` | `/exercises` | Browse full exercise database |
| `GET` | `/debug/bitmask` | Debug view of equipment bitmask |

### Example: `POST /user/setup`

```json
{
  "name": "Alex",
  "age": 24,
  "weight_kg": 75.0,
  "height_cm": 178.0,
  "gender": "male",
  "fitness_level": "intermediate",
  "goal": "muscle_gain",
  "available_minutes": 60,
  "equipment": ["bodyweight", "dumbbells", "bench"],
  "target_muscles": ["Chest", "Back", "Arms"]
}
```

### Example: `POST /generate` Response (simplified)

```json
{
  "plan": [
    {
      "name": "Dumbbell Bench Press",
      "muscle_group": "Chest",
      "sets": 3,
      "reps_low": 8,
      "reps_high": 12,
      "rest_seconds": 90,
      "calories": 45
    }
  ],
  "summary": {
    "total_exercises": 6,
    "total_sets": 18,
    "estimated_minutes": 52,
    "total_calories": 320
  }
}
```

---

## Onboarding Flow

```
Step 1: About You          → Personal details (name, age, weight, height, gender)
         ↓
Step 2: Fitness Profile    → Level & goal, session time
         ↓
Step 3: Equipment          → Select what you have (bodyweight always included)
         ↓
Step 4: Target Muscles     → Focus areas for the session
         ↓
POST /user/setup           → Profile saved, navigate to Dashboard
```

---

## Algorithm Pipeline

For a deep technical breakdown of all 4 algorithms (with code examples, complexity analysis, and worked examples), see **[DSA_REFERENCE.md](./DSA_REFERENCE.md)**.

```
Equipment + Time + Level + History
           |
    [Bitmask Filter]       O(n)     — compatible exercises only
           |
    [History Lookup]       O(1)     — penalize repeated exercises
           |
    [Knapsack DP]          O(n×W)   — optimal set within time budget
           |
    [Graph BFS]            O(V+E)   — logical exercise ordering
           |
      Workout Plan ✓
```

**Total Pipeline: O(n × W)** — dominated by the Knapsack DP step, where W = `available_minutes × 60 / 3` fatigue units.

---

> **Note:** The backend uses **in-memory storage**. Restarting `uvicorn` clears your profile and history — you'll need to complete onboarding again. To persist data across restarts, a SQLite integration would be the natural next step.
