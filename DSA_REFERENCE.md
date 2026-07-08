# FitDSA — Data Structures & Algorithms Reference

> **Full-Stack AI Workout Planner** | React + FastAPI | 4 Core DSA Algorithms

---

## Table of Contents

1. [System Overview — The DSA Pipeline](#system-overview)
2. [Algorithm 1 — Bitmask Equipment Filter O(1)](#algorithm-1-bitmask-equipment-filter)
3. [Algorithm 2 — Bounded Knapsack DP O(n x W)](#algorithm-2-bounded-knapsack-dp)
4. [Algorithm 3 — Weighted Exercise Graph + BFS O(V+E)](#algorithm-3-weighted-exercise-graph--bfs)
5. [Algorithm 4 — HashMap Workout History O(1)](#algorithm-4-hashmap-workout-history)
6. [Exercise Database Schema](#exercise-database-schema)
7. [API Endpoints](#api-endpoints)
8. [Complexity Summary Table](#complexity-summary-table)
9. [How User Profiles Feed the Algorithms](#how-user-profiles-feed-the-algorithms)
10. [Key Design Decisions](#key-design-decisions)

---

## System Overview

The full pipeline runs every time a user clicks **"Generate Workout"**:

```
User Profile (Equipment, Time, Level, History)
        |
        v
+---------------------+
|  Step 1: Bitmask    |  — Filter exercises by equipment  O(n)
|  Equipment Filter   |
+----------+----------+
           |  compatible_exercises[]
           v
+---------------------+
|  Step 2: HashMap    |  — Lookup yesterday's session     O(1)
|  History Lookup     |
+----------+----------+
           |  history_ids (Set)
           v
+---------------------+
|  Step 3: Bounded    |  — Select optimal exercise set    O(n x W)
|  Knapsack DP        |
+----------+----------+
           |  selected_exercises[]
           v
+---------------------+
|  Step 4: Graph BFS  |  — Order exercises in session     O(V + E)
|  Session Ordering   |
+----------+----------+
           |
           v
     Workout Plan (ordered, optimised, personalised)
```

**Total Pipeline Complexity: O(n x W)** — dominated by the Knapsack DP step.

---

## Algorithm 1: Bitmask Equipment Filter

**File:** `backend/dsa_engine.py` → `bitmask_filter()` and `equipment_to_mask()`
**File:** `backend/exercise_db.py` → `equipment_mask` field on every exercise

### The Core Idea

Each piece of gym equipment is assigned a **unique power-of-two integer** (a single bit in a binary number). This allows us to represent any *combination* of equipment as a single integer using bitwise OR (`|`), and check compatibility with bitwise AND (`&`) in **O(1)** time.

### Equipment Bit Encoding

| Equipment         | Bit | Decimal | Binary         |
|-------------------|:---:|:-------:|:--------------:|
| Bodyweight        |  0  |    1    | `0b00000001`   |
| Dumbbells         |  1  |    2    | `0b00000010`   |
| Barbell           |  2  |    4    | `0b00000100`   |
| Pull-up Bar       |  3  |    8    | `0b00001000`   |
| Resistance Bands  |  4  |   16    | `0b00010000`   |
| Kettlebell        |  5  |   32    | `0b00100000`   |
| Cable Machine     |  6  |   64    | `0b01000000`   |
| Bench             |  7  |  128    | `0b10000000`   |

### Example: Barbell Bench Press

The exercise requires **Barbell** (4) **and** **Bench** (128):

```python
equipment_mask = 4 | 128 = 132 = 0b10000100
```

If **Sam** (Full Gym) has mask = `1|2|4|8|128|64|32` = **239**:

```python
(132 & 239) == 132  →  True  → COMPATIBLE
```

If **Alex** (Home Gym, bodyweight + bands = 17) tries:

```python
(132 & 17) == 132  →  False  → INCOMPATIBLE
```

### Why Bitmask?

| Alternative               | Per-Check Complexity | Memory |
|---------------------------|:--------------------:|:------:|
| Nested list comparison    | O(k)                 | O(k)   |
| Set intersection          | O(min k1,k2)         | O(k)   |
| **Bitmask (ours)**        | **O(1)**             | **O(1)**|

A single integer AND replaces a nested loop — the same technique as Unix chmod permissions, IPv4 subnetting, and RGBA color channels.

### Code

```python
def bitmask_filter(exercises, user_equipment_mask):
    compatible = []
    for ex in exercises:
        # ALL bits required by exercise must exist in user's mask
        if (ex["equipment_mask"] & user_equipment_mask) == ex["equipment_mask"]:
            compatible.append(ex)
    return compatible  # O(n) total, O(1) per exercise
```

---

## Algorithm 2: Bounded Knapsack DP

**File:** `backend/dsa_engine.py` → `knapsack_workout()`

### Problem Framing

This is a **0/1 Knapsack** problem:

| Knapsack Concept | Workout Meaning |
|---|---|
| **Capacity W**   | `available_minutes x 60 / 3` — fatigue-unit budget |
| **Weight w_i**   | `exercise.fatigue_cost x fitness_level_multiplier` |
| **Value v_i**    | `exercise.calories x muscle_bonus x novelty_bonus` |
| **Item bounded** | Each exercise selected at most once per workout |
| **Goal**         | Maximise total calorie burn within fatigue budget |

### DP Formulation (1D Rolling Array)

```
dp[j] = max calories achievable with j fatigue-units of capacity

For each exercise i:
    For j from W DOWN TO w_i:   <- BACKWARDS prevents double-counting (0/1 property)
        dp[j] = max(dp[j], dp[j - w_i] + v_i)
```

**Why iterate backwards?**
Forward iteration would allow the same exercise `i` to be picked multiple times (Unbounded Knapsack). Backward iteration from `W -> w_i` ensures each item is considered once.

### Fitness Level Multipliers

| Level        | Fatigue Multiplier | Effect |
|---|---|---|
| Beginner     | x1.5 | Costs more → fewer exercises fit |
| Intermediate | x1.0 | Baseline |
| Advanced     | x0.75 | Costs less → more exercises, denser workouts |

### Value Modifiers

```python
# Muscle group targeting: +40% value for target muscle exercises
if exercise.muscle_group in target_muscles:
    value = int(value * 1.4)

# History deduplication penalty: -40% if done yesterday
if exercise.id in history_ids:     # O(1) HashMap lookup
    value = int(value * 0.60)
```

### Complexity

| | |
|---|---|
| **Time**  | O(n x W) where n=exercises, W=fatigue capacity |
| **Space** | O(W) — 1D rolling array (vs O(nxW) for 2D table) |

---

## Algorithm 3: Weighted Exercise Graph + BFS

**File:** `backend/dsa_engine.py` → `ExerciseGraph`, `bfs_session_order()`

### Graph Design

```
Nodes:   Each exercise is a vertex (25 nodes)
Edges:   Directed A → B = "B flows well after A"
Weights: edge_weight = source.fatigue_cost x fitness_level_scale
```

**Adjacency List representation** (sparse graph — optimal):

```python
adjacency: Dict[int, List[Tuple[int, float]]]
# Example:
{
  1:  [(2, 15.0), (5, 15.0)],   # Push-Up → Dumbbell Press, Pull-Up
  5:  [(6, 33.0), (7, 33.0)],   # Pull-Up → Deadlift, Dumbbell Row
  ...
}
```

### Adjacency List vs Matrix

| Criterion    | Adjacency List | Adjacency Matrix |
|---|---|---|
| Space        | O(V + E)       | O(V^2) |
| Iterate all  | O(V + E)       | O(V^2) |
| Best for     | **Sparse** (E << V^2) | Dense |

With 25 nodes and ~40 edges: E=40 << V^2=625 → Adjacency List wins.

### BFS Session Ordering

```python
def bfs_session_order(start_id, selected_ids):
    visited = set()
    queue = deque([start_id])   # O(1) popleft
    order = []

    while queue:
        current = queue.popleft()
        if current in visited: continue
        visited.add(current)
        if current in selected_ids:
            order.append(current)
        # Sort neighbours by weight ascending (lowest fatigue transition first)
        neighbours = sorted(adjacency[current], key=lambda x: x[1])
        for nid, _ in neighbours:
            if nid not in visited:
                queue.append(nid)
    return order
```

**Why BFS (not DFS)?**
BFS visits nodes in order of increasing distance from the start. This naturally creates:
1. Compound movements first (closest to the root)
2. Related isolation moves next
3. Finishing exercises at the end

DFS would go deep into one chain and backtrack — less ideal for workout flow.

### Edge Weights by Fitness Level

| Level        | Scale | Effect |
|---|---|---|
| Beginner     | x1.5  | Higher edge cost → BFS stays near "easy" exercises |
| Intermediate | x1.0  | Neutral |
| Advanced     | x0.75 | Lower edge cost → BFS explores heavier compound chains |

### Complexity

| Operation   | Complexity |
|---|---|
| Build Graph | O(V + E) |
| BFS         | O(V + E) |
| Space       | O(V + E) |

---

## Algorithm 4: HashMap Workout History

**File:** `backend/dsa_engine.py` → `WorkoutHistory` class

### Data Structure

```
WorkoutHistory._store:
    Dict[user_id -> Dict[day_offset -> Set[exercise_ids]]]

day_offset:
    0 = today
    1 = yesterday
    2 = two days ago
```

Python's `dict` is a **hash table** (open addressing, randomised hash seeds). O(1) average for get/set/delete.

### How It Prevents Repetition

```python
# O(1) lookup: get yesterday's exercise set
yesterday_ids = history.get_yesterday_ids(user_id)

# Inside Knapsack DP:
if exercise.id in yesterday_ids:   # O(1) Set membership
    value *= 0.60                   # 40% penalty, not a hard block
```

This is **soft deduplication**: the DP can still pick a repeated exercise if no compatible alternative fits, but it strongly prefers novelty.

### Session Logging

```python
def log_session(user_id, exercise_ids):
    # Shift: yesterday → 2-days-ago, today → yesterday
    user_hist[2] = user_hist[1].copy()
    user_hist[1] = user_hist[0].copy()
    user_hist[0] = set(exercise_ids)   # O(k) where k = session size
```

### Why Set (not List) for exercise IDs?

| Operation            | List   | Set    |
|---|---|---|
| Membership `x in S`  | O(n)   | **O(1) avg** |
| Insert               | O(1)   | O(1)   |
| Memory               | O(n)   | O(n)   |

Since the membership check runs inside the O(n x W) Knapsack loop, the O(1) vs O(n) difference compounds significantly.

---

## Exercise Database Schema

**File:** `backend/exercise_db.py`

```python
{
    "id":             int,       # Unique graph node ID
    "name":           str,       # Display name
    "muscle_group":   str,       # "Chest" | "Back" | "Shoulders" | "Legs" | "Core" | "Arms" | "Cardio"
    "equipment_mask": int,       # Bitmask (feeds Algorithm 1)
    "calories":       int,       # kcal per set (knapsack value)
    "fatigue_cost":   int,       # Fatigue units (knapsack weight)
    "difficulty":     int,       # 1 | 2 | 3
    "sets":           int,
    "reps_low":       int,
    "reps_high":      int,
    "rest_seconds":   int,
    "description":    str,
    "neighbors":      List[int], # Graph edges (feeds Algorithm 3)
}
```

---

## API Endpoints

| Method | Endpoint              | DSA Used          | Description |
|--------|----------------------|-------------------|-------------|
| GET    | `/`                  | —                 | Health check |
| GET    | `/profiles`          | Bitmask           | 4 profile cards with pre-computed masks |
| POST   | `/generate`          | All 4 algorithms  | **Main pipeline** |
| GET    | `/exercises`         | —                 | Full DB with decoded masks |
| GET    | `/graph/{profile_id}`| Graph build       | Adjacency list for visualisation |
| POST   | `/history/{uid}/log` | HashMap           | Log a session |
| GET    | `/history/{uid}`     | HashMap           | Retrieve user history |
| GET    | `/debug/bitmask`     | Bitmask           | Debug: masks for all profiles |

### POST /generate — Request

```json
{
  "profile_id": "user_gamma",
  "custom_muscles": ["Chest", "Back"]
}
```

### POST /generate — Response

```json
{
  "plan": [ /* ordered exercise objects */ ],
  "summary": {
    "total_exercises": 23, "total_sets": 79,
    "estimated_minutes": 196.7, "total_calories": 1018,
    "user_mask": 239
  },
  "dsa_trace": {
    "step1_bitmask":  { "exercises_before_filter": 25, "exercises_after_filter": 23 },
    "step2_hashmap":  { "yesterday_ids": [] },
    "step3_knapsack": { "dp_table_size": "23 x 1800", "time_complexity": "O(n x W)" },
    "step4_graph":    { "nodes": 23, "edges": 38, "complexity": "O(V + E)" }
  },
  "graph_data": { "nodes": [...], "edges": [...] },
  "history": { "today": [...], "yesterday": [...], "two_days_ago": [...] }
}
```

---

## Complexity Summary Table

| Algorithm         | Data Structure           | Time       | Space      |
|-------------------|--------------------------|:----------:|:----------:|
| Equipment Filter  | Bitmask (integer AND)    | O(n)       | O(1)       |
| Workout Selection | 1D DP Array (Knapsack)   | O(n x W)   | O(W)       |
| Session Ordering  | Adjacency List + BFS     | O(V + E)   | O(V + E)   |
| History Dedup     | HashMap + HashSet        | O(1)       | O(U x D)   |
| **Full Pipeline** | **All above**            | **O(n x W)** | O(W+V+E) |

> n = compatible exercises, W = fatigue capacity, V = vertices, E = edges, U = users, D = days

---

## How User Profiles Feed the Algorithms

The Profile Selector is the UI entry point that configures all four algorithms:

```
Profile Field           DSA Input
─────────────────────────────────────────────────────
equipment[]          →  equipment_to_mask() → bitmask integer
available_minutes    →  W (knapsack capacity)
fitness_level        →  fatigue multiplier (x0.75 / x1.0 / x1.5)
                         AND edge weight scale in graph
target_muscles[]     →  value bonus in knapsack DP
user_id              →  HashMap key for history lookup
```

### Profile Comparison

| Profile                        | Equipment Mask | Compatible | Knapsack W | Multiplier |
|-------------------------------|:--------------:|:----------:|:----------:|:----------:|
| Alex (Beginner, Home)         | 17 (0b00010001)| 8          | 600        | x1.5       |
| Jordan (Intermediate, Dumbbells)| 147          | 14         | 1100       | x1.0       |
| Sam (Advanced, Full Gym)      | 239 (0b11101111)| 23        | 1800       | x0.75      |
| Riley (Intermediate, Kettlebell)| 41           | 10         | 900        | x1.0       |

The **same 4 algorithms** produce completely different plans because the input parameters change the search space, capacity, and weights.

---

## Key Design Decisions

### 1. Why Knapsack DP over Greedy selection?

Greedy (always pick highest calorie-per-fatigue) misses combinations. Example:

```
Capacity = 30 units
Exercise A: weight=20, value=25
Exercise B: weight=10, value=14
Exercise C: weight=10, value=12

Greedy picks A (best ratio=1.25) → total value = 25
DP picks B+C (both fit) → total value = 26  ← BETTER
```

### 2. Why BFS and not Dijkstra for ordering?

Dijkstra finds the minimum-cost *path* — a point-to-point problem. We want *breadth-first exploration* of the exercise graph from a root to visit all selected exercises. BFS level-order naturally produces: compound → compound → isolation → finisher.

### 3. Why Sets for history IDs (not Lists)?

The `exercise.id in history_ids` check runs inside the O(n x W) knapsack loop. Using a Python Set (hash table O(1)) vs List (O(n)) is critical for performance at scale.

### 4. Why 1D DP Array (not 2D table)?

Space: O(W) vs O(n x W). With W=1800 and n=23, the 2D table is 41,400 cells. The 1D rolling array is 1,800 cells — 23x more memory efficient with identical correctness when iterating backwards.

### 5. Why the Profile Selector approach (not OAuth)?

Implementing OAuth/JWT correctly takes days and adds zero algorithmic value. The Profile Selector instantly demonstrates the core thesis: **different user parameters → different algorithm inputs → radically different outputs**. This is far more impressive to professors than a login form.

---

## Running the Project

### Backend (FastAPI)

```bash
cd workout-planner/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend (React + Vite)

```bash
cd workout-planner/frontend
npm run dev
# App: http://localhost:3000
```

### Test DSA Pipeline via cURL

```bash
# Full pipeline for advanced user
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "user_gamma"}' | python3 -m json.tool

# See bitmask comparison across all profiles
curl http://localhost:8000/debug/bitmask | python3 -m json.tool

# Run Alex twice to see HashMap history deduplication in action
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "user_alpha"}'
# 2nd run: repeated exercises show is_repeated_from_yesterday: true
```

---

*Backend: FastAPI (Python) | Frontend: React + Vite | Algorithms: Pure Python — no ML libraries used*
