"""
dsa_engine.py
=============
Core Data Structures & Algorithms module for the Workout Planner.

Algorithms Implemented:
  1. Bitmask Filtering       → O(1) per exercise, O(n) total — equipment compatibility
  2. Bounded Knapsack DP     → O(n × W) dynamic programming — time-optimal workout
  3. Weighted Exercise Graph → BFS/DFS traversal — muscle-group session flow
  4. HashMap Deduplication   → O(1) lookup — avoid repeating yesterday's exercises

Each function is heavily documented to explain the DSA logic.
"""

from typing import List, Dict, Tuple, Set
from collections import defaultdict, deque
import json


# ═══════════════════════════════════════════════════════════════════════════════
# 1. BITMASK FILTERING  — O(n) over exercise DB, O(1) per check
# ═══════════════════════════════════════════════════════════════════════════════

def bitmask_filter(exercises: List[Dict], user_equipment_mask: int) -> List[Dict]:
    """
    Filter exercises based on equipment availability using bitwise AND.

    HOW IT WORKS:
        Each exercise stores an 'equipment_mask' — an integer where each bit
        represents a piece of equipment required.

        Equipment bit-encoding:
          Bit 0 (1)   = Bodyweight
          Bit 1 (2)   = Dumbbells
          Bit 2 (4)   = Barbell
          Bit 3 (8)   = Pull-up Bar
          Bit 4 (16)  = Resistance Bands
          Bit 5 (32)  = Kettlebell
          Bit 6 (64)  = Cable Machine
          Bit 7 (128) = Bench

        FILTER CONDITION:
            (exercise.equipment_mask & user_equipment_mask) == exercise.equipment_mask

        This means ALL bits set in the exercise mask must also be set in the
        user's mask. If the user has {Barbell + Bench} = 4 | 128 = 132,
        then Barbell Bench Press (mask=4|128=132) passes: 132 & 132 == 132 ✓
        But Cable Fly (mask=64) fails: 64 & 132 == 0 ✗

    TIME COMPLEXITY:  O(n)   — iterate all exercises once
    SPACE COMPLEXITY: O(k)   — output list of k compatible exercises
    """
    compatible = []
    for ex in exercises:
        # Bitwise AND — check if ALL required bits are present in user's set
        if (ex["equipment_mask"] & user_equipment_mask) == ex["equipment_mask"]:
            compatible.append(ex)
    return compatible


def equipment_to_mask(equipment_list: List[str]) -> int:
    """
    Convert a human-readable list of equipment names to a bitmask integer.

    Example:
        ["bodyweight", "dumbbells", "bench"] → 1 | 2 | 128 = 131
    """
    EQUIPMENT_BITS = {
        "bodyweight":      1,
        "dumbbells":       2,
        "barbell":         4,
        "pullup_bar":      8,
        "resistance_bands": 16,
        "kettlebell":      32,
        "cable_machine":   64,
        "bench":           128,
    }
    mask = 0
    for item in equipment_list:
        mask |= EQUIPMENT_BITS.get(item.lower(), 0)
    return mask


def mask_to_equipment(mask: int) -> List[str]:
    """Decode a bitmask back to a list of equipment names (for display)."""
    BITS_TO_EQUIPMENT = {
        1:   "Bodyweight",
        2:   "Dumbbells",
        4:   "Barbell",
        8:   "Pull-up Bar",
        16:  "Resistance Bands",
        32:  "Kettlebell",
        64:  "Cable Machine",
        128: "Bench",
    }
    result = []
    for bit, name in BITS_TO_EQUIPMENT.items():
        if mask & bit:
            result.append(name)
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# 2. BOUNDED KNAPSACK DP  — O(n × W) where n=exercises, W=capacity (minutes)
# ═══════════════════════════════════════════════════════════════════════════════

def knapsack_workout(
    exercises: List[Dict],
    available_minutes: int,
    fitness_level: str,         # "beginner" | "intermediate" | "advanced"
    target_muscles: List[str],  # e.g. ["Chest", "Back"]
    history_ids: Set[int],      # ids seen yesterday — avoid repeating
) -> Tuple[List[Dict], Dict]:
    """
    Bounded Knapsack DP to select the optimal set of exercises within a time budget.

    PROBLEM FRAMING:
        - CAPACITY (W)   = available_minutes × 60 (converted to seconds of effort)
        - WEIGHT  (w_i)  = exercise.fatigue_cost  (adjusted by difficulty & level)
        - VALUE   (v_i)  = exercise.calories × muscle_group_bonus × novelty_bonus

    DIFFICULTY ADJUSTMENT (edge-weight dynamic per fitness level):
        - Beginner:      fatigue_cost × 1.5   (exercises tire beginners faster)
        - Intermediate:  fatigue_cost × 1.0
        - Advanced:      fatigue_cost × 0.75  (veterans handle load better)

    NOVELTY BONUS (from workout history HashMap):
        If an exercise was done yesterday (id in history_ids), its value drops by 40%.
        This discourages the algorithm from repeatedly selecting the same routine.

    DP FORMULATION:
        dp[j] = max total calories achievable with exactly j fatigue units spent
        For each exercise i (bounded to 1 use per workout):
            For j from W down to w_i:          ← 0/1 knapsack inner loop direction
                dp[j] = max(dp[j], dp[j - w_i] + v_i)

    TIME COMPLEXITY:  O(n × W) — n exercises, W = capacity in fatigue units
    SPACE COMPLEXITY: O(W)     — 1D DP array

    Returns:
        selected_exercises: list of chosen exercise dicts
        dp_trace: metadata about the DP run for frontend display
    """
    # ── Fitness level multipliers (dynamic edge weights in graph analogy) ──
    LEVEL_MULTIPLIER = {"beginner": 1.5, "intermediate": 1.0, "advanced": 0.75}
    multiplier = LEVEL_MULTIPLIER.get(fitness_level, 1.0)

    # ── Target muscle bonus (prioritise requested muscle groups) ──
    MUSCLE_BONUS = 1.4  # 40% value boost for exercises hitting target muscles

    # Capacity: convert minutes to fatigue-unit budget
    # Each "fatigue unit" ≈ 1 second of sustained effort
    W = int(available_minutes * 60 / 3)  # scale minutes to fatigue units

    n = len(exercises)
    if n == 0 or W <= 0:
        return [], {"dp_table_size": 0, "algorithm": "bounded_knapsack"}

    # ── Precompute adjusted weights and values ──
    weights = []
    values  = []
    for ex in exercises:
        w = int(ex["fatigue_cost"] * multiplier)
        w = max(w, 1)  # ensure at least 1 unit
        v = ex["calories"]
        # Muscle group bonus
        if ex["muscle_group"] in target_muscles:
            v = int(v * MUSCLE_BONUS)
        # History penalty: seen yesterday → 40% value cut
        if ex["id"] in history_ids:
            v = int(v * 0.60)
        weights.append(w)
        values.append(v)

    # ── 1D DP array — classic 0/1 Knapsack ──
    dp   = [0] * (W + 1)
    keep = [[] for _ in range(W + 1)]   # track which exercises land in each cell

    for i in range(n):
        w_i = weights[i]
        v_i = values[i]
        # Iterate BACKWARDS to prevent using exercise i more than once
        for j in range(W, w_i - 1, -1):
            candidate = dp[j - w_i] + v_i
            if candidate > dp[j]:
                dp[j] = candidate
                keep[j] = keep[j - w_i] + [i]

    # ── Retrieve selected exercise indices ──
    selected_indices = keep[W]
    selected = [exercises[i] for i in selected_indices]

    # ── Sort by muscle group for logical workout flow ──
    GROUP_ORDER = {"Legs": 0, "Back": 1, "Chest": 2, "Shoulders": 3,
                   "Arms": 4, "Core": 5, "Cardio": 6}
    selected.sort(key=lambda ex: GROUP_ORDER.get(ex["muscle_group"], 99))

    dp_trace = {
        "algorithm":       "0/1 Bounded Knapsack DP",
        "capacity_units":  W,
        "n_exercises":     n,
        "dp_table_size":   f"{n} × {W}",
        "time_complexity": "O(n × W)",
        "space_complexity": "O(W) — 1D rolling array",
        "level_multiplier": multiplier,
        "total_calories":  dp[W],
        "selected_count":  len(selected),
        "fitness_level":   fitness_level,
    }
    return selected, dp_trace


# ═══════════════════════════════════════════════════════════════════════════════
# 3. WEIGHTED EXERCISE GRAPH — Adjacency List + BFS/DFS traversal
# ═══════════════════════════════════════════════════════════════════════════════

class ExerciseGraph:
    """
    Directed Weighted Graph where nodes = exercises, edges = "flows well into" relationship.

    GRAPH DESIGN:
        Nodes:  Each exercise is a vertex.
        Edges:  An edge A → B means exercise B is a good superset/follow-up for A.
                Edge weights represent transition fatigue cost.

    For fitness level adjustments, edge weights are multiplied by a level scalar.
    Beginners take longer to recover → higher edge weight → BFS visits fewer nodes.

    DATA STRUCTURE:
        adjacency_list: Dict[int, List[Tuple[int, float]]]
            key   = source exercise id
            value = list of (target_id, edge_weight)

    TIME COMPLEXITY:
        BFS/DFS traversal: O(V + E)   where V = exercises, E = edges
        Graph build:       O(n)        one pass over exercise DB
    """

    def __init__(self, exercises: List[Dict], fitness_level: str = "intermediate"):
        LEVEL_EDGE = {"beginner": 1.5, "intermediate": 1.0, "advanced": 0.7}
        self.edge_scale = LEVEL_EDGE.get(fitness_level, 1.0)
        self.fitness_level = fitness_level
        self.adjacency: Dict[int, List[Tuple[int, float]]] = defaultdict(list)
        self.nodes: Dict[int, Dict] = {}
        self._build(exercises)

    def _build(self, exercises: List[Dict]):
        """Construct adjacency list from exercise neighbor definitions."""
        ex_ids = {ex["id"] for ex in exercises}  # only add edges for available exercises
        for ex in exercises:
            self.nodes[ex["id"]] = ex
            for neighbor_id in ex.get("neighbors", []):
                if neighbor_id in ex_ids:
                    # Edge weight = (fatigue_cost of source) × level_scale
                    weight = round(ex["fatigue_cost"] * self.edge_scale, 2)
                    self.adjacency[ex["id"]].append((neighbor_id, weight))

    def bfs_session_order(self, start_id: int, selected_ids: Set[int]) -> List[int]:
        """
        BFS from a start exercise to determine optimal exercise ordering in a session.

        WHY BFS?
            BFS ensures we explore exercises "closest" (lowest transition cost) first.
            This creates a natural workout flow:
            compound movements → isolation → finishers

        TIME COMPLEXITY: O(V + E) — visits each node and edge once
        """
        if start_id not in self.nodes:
            return list(selected_ids)

        visited = set()
        queue = deque([start_id])
        order = []

        while queue:
            current = queue.popleft()
            if current in visited:
                continue
            visited.add(current)
            if current in selected_ids:
                order.append(current)
            # Add neighbors in sorted order (by edge weight ascending)
            neighbors = sorted(self.adjacency.get(current, []), key=lambda x: x[1])
            for neighbor_id, _ in neighbors:
                if neighbor_id not in visited:
                    queue.append(neighbor_id)

        # Append any selected exercises not reachable from start_id
        for sid in selected_ids:
            if sid not in order:
                order.append(sid)

        return order

    def get_graph_data(self) -> Dict:
        """Return graph structure suitable for frontend visualization."""
        nodes_out = []
        edges_out = []
        for nid, ex in self.nodes.items():
            nodes_out.append({
                "id": nid,
                "label": ex["name"],
                "group": ex["muscle_group"],
                "difficulty": ex["difficulty"],
            })
        for src, neighbors in self.adjacency.items():
            for tgt, weight in neighbors:
                edges_out.append({
                    "from": src,
                    "to":   tgt,
                    "weight": weight,
                    "label": f"{weight}",
                })
        return {
            "nodes": nodes_out,
            "edges": edges_out,
            "algorithm": "Adjacency List Graph (BFS traversal)",
            "edge_scale": self.edge_scale,
            "fitness_level": self.fitness_level,
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 4. HASHMAP WORKOUT HISTORY  — O(1) average lookup and insert
# ═══════════════════════════════════════════════════════════════════════════════

class WorkoutHistory:
    """
    In-memory HashMap (Python dict) storing each user's recent exercise history.

    STRUCTURE:
        history: Dict[user_id → Dict[day_offset → Set[exercise_ids]]]

        day_offset:  0 = today, 1 = yesterday, 2 = two days ago, …

    WHY HASHMAP?
        O(1) average-case lookup, insert, delete (Python dict = hash table).
        Lookup 'did user X do exercise Y yesterday?' is O(1):
            exercise_id in history[user_id][1]

    COLLISION HANDLING:
        Python's built-in dict uses open addressing with randomized hash seeds.
        No manual collision handling needed.

    DEDUPLICATION STRATEGY:
        When the knapsack DP selects exercises, it queries yesterday's set (day=1).
        Any exercise in that set gets a 40% value penalty in the DP value function,
        discouraging the algorithm from repeating the same session twice in a row.
    """

    def __init__(self):
        # user_id → {0: set(), 1: set()}
        self._store: Dict[str, Dict[int, Set[int]]] = defaultdict(
            lambda: defaultdict(set)
        )

    def log_session(self, user_id: str, exercise_ids: List[int]):
        """
        Shift history forward one day and log today's session.
        - O(1) per operation — dict set/get
        """
        user_hist = self._store[user_id]
        # Shift: yesterday becomes 2-days-ago, today becomes yesterday
        user_hist[2] = user_hist.get(1, set()).copy()
        user_hist[1] = user_hist.get(0, set()).copy()
        # Log today
        user_hist[0] = set(exercise_ids)

    def get_yesterday_ids(self, user_id: str) -> Set[int]:
        """Return the set of exercise IDs done yesterday. O(1) lookup."""
        return self._store[user_id].get(1, set())

    def get_full_history(self, user_id: str) -> Dict:
        """Return full history for display."""
        h = self._store[user_id]
        return {
            "today":      list(h.get(0, set())),
            "yesterday":  list(h.get(1, set())),
            "two_days_ago": list(h.get(2, set())),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 5. WORKOUT GENERATOR — orchestrates all 4 DSA components
# ═══════════════════════════════════════════════════════════════════════════════

def generate_workout_plan(
    all_exercises: List[Dict],
    user_profile: Dict,
    history: WorkoutHistory,
) -> Dict:
    """
    Orchestrate all DSA components to produce a personalised workout plan.

    PIPELINE:
        1. Bitmask Filter → compatible exercises          O(n)
        2. HashMap Lookup → yesterday's exercise ids      O(1)
        3. Knapsack DP    → optimal exercise selection    O(n × W)
        4. Graph BFS      → optimal session ordering      O(V + E)

    Total Complexity: O(n × W) dominated by the DP step.
    """
    uid        = user_profile["id"]
    equipment  = user_profile["equipment"]        # list of equipment names
    minutes    = user_profile["available_minutes"]
    level      = user_profile["fitness_level"]
    muscles    = user_profile["target_muscles"]

    # ── Step 1: Bitmask Filter ──────────────────────────────────────────────
    user_mask = equipment_to_mask(equipment)
    compatible = bitmask_filter(all_exercises, user_mask)

    # ── Step 2: HashMap — yesterday's history ──────────────────────────────
    yesterday_ids = history.get_yesterday_ids(uid)

    # ── Step 3: Knapsack DP ────────────────────────────────────────────────
    selected, dp_trace = knapsack_workout(
        exercises=compatible,
        available_minutes=minutes,
        fitness_level=level,
        target_muscles=muscles,
        history_ids=yesterday_ids,
    )

    # ── Step 4: Graph BFS — session ordering ───────────────────────────────
    graph = ExerciseGraph(compatible, fitness_level=level)
    selected_ids = {ex["id"] for ex in selected}

    # Pick the first exercise (lowest fatigue_cost compound) as BFS root
    if selected:
        start_compound = min(selected, key=lambda x: x["difficulty"])
        bfs_order = graph.bfs_session_order(start_compound["id"], selected_ids)
        # Re-order selected exercises following BFS traversal
        id_to_ex = {ex["id"]: ex for ex in selected}
        ordered_selected = [id_to_ex[eid] for eid in bfs_order if eid in id_to_ex]
    else:
        ordered_selected = selected

    # ── Log today's session to history ─────────────────────────────────────
    history.log_session(uid, [ex["id"] for ex in ordered_selected])

    # ── Build summary ───────────────────────────────────────────────────────
    total_calories  = sum(ex["calories"] * ex["sets"] for ex in ordered_selected)
    total_sets      = sum(ex["sets"] for ex in ordered_selected)
    estimated_time  = sum(
        ex["sets"] * ((ex["reps_low"] + ex["reps_high"]) / 2) * 3 + ex["rest_seconds"] * ex["sets"]
        for ex in ordered_selected
    ) / 60  # minutes

    return {
        "plan": [
            {
                **ex,
                "equipment_names": mask_to_equipment(ex["equipment_mask"]),
                "is_repeated_from_yesterday": ex["id"] in yesterday_ids,
            }
            for ex in ordered_selected
        ],
        "summary": {
            "total_exercises":   len(ordered_selected),
            "total_sets":        total_sets,
            "estimated_minutes": round(estimated_time, 1),
            "total_calories":    total_calories,
            "user_mask":         user_mask,
            "equipment_names":   mask_to_equipment(user_mask),
            "muscle_groups_hit": list({ex["muscle_group"] for ex in ordered_selected}),
        },
        "dsa_trace": {
            "step1_bitmask": {
                "description": "Equipment Bitmask Filter",
                "user_equipment_mask": f"{user_mask} (binary: {bin(user_mask)})",
                "exercises_before_filter": len(all_exercises),
                "exercises_after_filter":  len(compatible),
                "complexity": "O(n) — single pass, O(1) per bitwise AND check",
            },
            "step2_hashmap": {
                "description": "Workout History HashMap Lookup",
                "yesterday_ids": list(yesterday_ids),
                "complexity": "O(1) average — Python dict (hash table)",
            },
            "step3_knapsack": dp_trace,
            "step4_graph": {
                "description": "Exercise Graph BFS Session Ordering",
                "nodes": len(compatible),
                "edges": sum(len(v) for v in graph.adjacency.values()),
                "complexity": "O(V + E) BFS traversal",
                "fitness_edge_scale": graph.edge_scale,
            },
        },
        "graph_data": graph.get_graph_data(),
        "history":     history.get_full_history(uid),
    }
