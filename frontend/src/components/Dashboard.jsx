import React, { useState, useEffect } from 'react';
import { getUser, generateWorkout, getHistory } from '../api';
import DSATrace from './DSATrace';
import {
  RiUserLine,
  RiScalesLine,
  RiRulerLine,
  RiBarChartBoxLine,
  RiFlashlightLine,
  RiTimeLine,
  RiSettings4Line,
  RiPlayCircleLine,
  RiRefreshLine,
  RiHistoryLine,
  RiCheckboxCircleLine,
  RiAlgorithmLine,
  RiFireLine,
  RiGroupLine,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiCpuLine,
} from 'react-icons/ri';
import './Dashboard.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const GOAL_LABELS = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain',
  endurance:   'Endurance',   strength:    'Strength',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function UserCard({ user, onEdit }) {
  const s = user.body_stats || {};

  return (
    <div className="user-card glass-card">
      <div className="uc-avatar">
        <span className="uc-initials">{user.name?.[0]?.toUpperCase()}</span>
      </div>

      <div className="uc-info">
        <h2 className="uc-name">{user.name}</h2>
        <span className="uc-goal">{GOAL_LABELS[user.goal] || user.goal}</span>
      </div>

      <div className="uc-stats">
        <div className="uc-stat">
          <RiScalesLine size={13} className="uc-stat-icon" />
          <span className="uc-val">{user.weight_kg} <small>kg</small></span>
          <span className="uc-lbl">Weight</span>
        </div>
        <div className="uc-sep" />
        <div className="uc-stat">
          <RiRulerLine size={13} className="uc-stat-icon" />
          <span className="uc-val">{user.height_cm} <small>cm</small></span>
          <span className="uc-lbl">Height</span>
        </div>
        <div className="uc-sep" />
        <div className="uc-stat">
          <RiBarChartBoxLine size={13} className="uc-stat-icon" />
          <span className="uc-val">{s.bmi}</span>
          <span className="uc-lbl">BMI</span>
        </div>
        <div className="uc-sep" />
        <div className="uc-stat">
          <RiFireLine size={13} className="uc-stat-icon" />
          <span className="uc-val">{s.tdee}</span>
          <span className="uc-lbl">TDEE</span>
        </div>
      </div>

      <div className="uc-dsa">
        <div className="uc-dsa-row">
          <span className="uc-dsa-label">Equipment Mask</span>
          <span className="uc-dsa-value">
            {user.equipment_mask} &nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-400)' }}>
              {user.equipment_binary}
            </span>
          </span>
        </div>
        <div className="uc-dsa-row">
          <span className="uc-dsa-label">Compatible</span>
          <span className="uc-dsa-value">{user.compatible_exercises} / 25</span>
        </div>
        <div className="uc-dsa-row">
          <span className="uc-dsa-label">Fitness Level</span>
          <span className="uc-dsa-value" style={{ textTransform: 'capitalize' }}>
            {user.fitness_level}
          </span>
        </div>
        <div className="uc-dsa-row">
          <span className="uc-dsa-label">Time Budget</span>
          <span className="uc-dsa-value">
            {Math.round(user.available_minutes * 60 / 3)} units ({user.available_minutes} min)
          </span>
        </div>
      </div>

      <div className="uc-muscles">
        {(user.target_muscles || []).map(m => (
          <span key={m} className="uc-muscle-tag">{m}</span>
        ))}
      </div>

      <button className="uc-edit-btn btn btn-ghost" onClick={onEdit}>
        <RiSettings4Line size={13} /> Edit Profile
      </button>
    </div>
  );
}

function DifficultyDots({ level }) {
  return (
    <div className="difficulty-dots">
      {[1,2,3].map(d => (
        <span key={d} className={`difficulty-dot ${d <= level ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

function ExerciseCard({ ex, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="exercise-card fade-in-up" style={{ animationDelay: `${index * 45}ms` }}>
      <div className="exercise-accent" />
      <div className="exercise-order">{String(index + 1).padStart(2, '0')}</div>

      <div className="exercise-content">
        <div className="exercise-top">
          <div className="exercise-meta">
            <h4 className="exercise-name">{ex.name}</h4>
            <span className="exercise-group">{ex.muscle_group}</span>
            {ex.is_repeated_from_yesterday && (
              <span className="repeat-badge">Repeated</span>
            )}
          </div>
          <DifficultyDots level={ex.difficulty} />
        </div>

        <div className="exercise-stats">
          <div className="ex-stat"><span className="ex-stat-val">{ex.sets}</span><span className="ex-stat-lbl">Sets</span></div>
          <div className="ex-sep" />
          <div className="ex-stat"><span className="ex-stat-val">{ex.reps_low}–{ex.reps_high}</span><span className="ex-stat-lbl">Reps</span></div>
          <div className="ex-sep" />
          <div className="ex-stat"><span className="ex-stat-val">{ex.rest_seconds}s</span><span className="ex-stat-lbl">Rest</span></div>
          <div className="ex-sep" />
          <div className="ex-stat">
            <span className="ex-stat-val">{ex.calories * ex.sets} <small>kcal</small></span>
            <span className="ex-stat-lbl">Calories</span>
          </div>
        </div>

        <div className="exercise-equipment">
          {(ex.equipment_names || []).map(eq => (
            <span key={eq} className="equipment-tag">{eq}</span>
          ))}
        </div>
      </div>

      <button className="exercise-expand" onClick={() => setExpanded(!expanded)}>
        {expanded ? <RiArrowUpSLine size={16} /> : <RiArrowDownSLine size={16} />}
      </button>

      {expanded && (
        <div className="exercise-desc">
          <p>{ex.description}</p>
          <div className="exercise-bitmask">
            <span className="dsa-label">Equipment mask:</span>
            <span className="code-inline">
              {ex.equipment_mask} ({`0b${ex.equipment_mask.toString(2).padStart(8, '0')}`})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryPanel({ summary, user }) {
  const s = user?.body_stats || {};
  const burnPercent = s.tdee ? Math.round((summary.total_calories / s.tdee) * 100) : 0;

  return (
    <div className="summary-panel glass-card">
      <h3 className="summary-title">Session Summary</h3>
      <div className="summary-grid">
        <div className="summary-stat">
          <span className="summary-val">{summary.total_exercises}</span>
          <span className="summary-lbl">Exercises</span>
        </div>
        <div className="summary-stat">
          <span className="summary-val">{summary.total_sets}</span>
          <span className="summary-lbl">Sets</span>
        </div>
        <div className="summary-stat">
          <span className="summary-val">{summary.estimated_minutes}</span>
          <span className="summary-lbl">Est. Min</span>
        </div>
        <div className="summary-stat">
          <span className="summary-val">{summary.total_calories}</span>
          <span className="summary-lbl">Calories</span>
        </div>
      </div>

      {s.tdee && (
        <div className="tdee-bar-wrap">
          <div className="tdee-bar-label">
            <span>{summary.total_calories} kcal</span>
            <span>{burnPercent}% of TDEE</span>
          </div>
          <div className="tdee-bar">
            <div className="tdee-bar-fill" style={{ width: `${Math.min(burnPercent, 100)}%` }} />
          </div>
        </div>
      )}

      <div className="summary-muscles">
        <span className="summary-lbl-sm">Muscle Groups</span>
        <div className="muscle-tags">
          {(summary.muscle_groups_hit || []).map(m => (
            <span key={m} className="muscle-tag">{m}</span>
          ))}
        </div>
      </div>

      <div className="summary-bitmask">
        <span className="dsa-label">Equipment Mask</span>
        <span className="code-inline">
          {summary.user_mask} = 0b{summary.user_mask?.toString(2).padStart(8,'0')}
        </span>
      </div>
    </div>
  );
}

function HistoryTab({ history }) {
  if (!history || !history.sessions?.length) {
    return (
      <div className="history-empty">
        <RiHistoryLine size={32} style={{ opacity: 0.3 }} />
        <span>No workout history yet. Generate your first workout!</span>
      </div>
    );
  }
  return (
    <div className="history-list">
      {history.sessions.map((s, i) => (
        <div key={i} className="history-session glass-card">
          <div className="hs-date">{s.date}</div>
          <div className="hs-stats">
            <span>{s.exercise_ids.length} exercises</span>
            <span>•</span>
            <span>{s.total_calories} kcal</span>
            <span>•</span>
            <span>{s.total_minutes} min</span>
          </div>
          <div className="hs-ids">
            {s.exercise_ids.map(id => (
              <span key={id} className="history-id">#{id}</span>
            ))}
          </div>
        </div>
      ))}
      <div className="history-note">
        Previously completed exercises are penalized in the Knapsack DP to promote variety.
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard({ initialUser, onEditProfile }) {
  const [user, setUser]       = useState(initialUser);
  const [plan, setPlan]       = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('plan');

  useEffect(() => {
    getHistory().then(r => setHistory(r.data)).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateWorkout({});
      setPlan(res.data);
      const histRes = await getHistory();
      setHistory(histRes.data);
      setActiveTab('plan');
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: 'plan',    label: 'Workout Plan',    icon: <RiCheckboxCircleLine size={14} /> },
    { id: 'trace',   label: 'Algorithm Trace', icon: <RiAlgorithmLine size={14} /> },
    { id: 'history', label: 'History',         icon: <RiHistoryLine size={14} /> },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <UserCard user={user} onEdit={onEditProfile} />

        <div className="sidebar-history glass-card">
          <h4 className="sh-title">
            <RiHistoryLine size={13} /> Recent Sessions
          </h4>
          {history?.sessions?.length ? (
            <div className="sh-list">
              {history.sessions.slice(0, 5).map((s, i) => (
                <div key={i} className="sh-row">
                  <span className="sh-date">{s.date}</span>
                  <span className="sh-cal">{s.total_calories} kcal</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sh-empty">No sessions yet</p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {/* Action bar */}
        <div className="plan-action-bar">
          <div className="plan-action-info">
            <span className="greeting">
              Hello, <strong>{user.name}</strong>. Ready for your workout?
            </span>
            <span className="plan-subtitle">
              {user.fitness_level} · {user.available_minutes} min · {user.compatible_exercises} exercises available
            </span>
          </div>
          <button
            className="btn btn-primary generate-btn"
            onClick={handleGenerate}
            disabled={loading}
            id="generate-btn"
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</>
            ) : plan
              ? <><RiRefreshLine size={14} /> Regenerate</>
              : <><RiPlayCircleLine size={15} /> Generate Workout</>
            }
          </button>
        </div>

        {error && (
          <div className="plan-error">Error: {error}</div>
        )}

        {!plan && !loading && (
          <div className="plan-placeholder">
            <div className="pp-icon"><RiCpuLine /></div>
            <h3>Your Personalized Workout Plan</h3>
            <p>Click <strong>Generate Workout</strong> to run the DSA pipeline and create your optimized session.</p>
            <div className="pp-pipeline">
              <span>Bitmask Filter</span>
              <span className="pp-arrow">→</span>
              <span>Knapsack DP</span>
              <span className="pp-arrow">→</span>
              <span>Graph BFS</span>
              <span className="pp-arrow">→</span>
              <span>Muscle Sort</span>
            </div>
          </div>
        )}

        {plan && (
          <>
            <div className="plan-tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`plan-tab ${activeTab === t.id ? 'plan-tab--active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'plan' && (
              <div className="plan-content fade-in-up">
                <SummaryPanel summary={plan.summary} user={plan.user} />
                <div className="exercises-list">
                  {plan.plan.map((ex, i) => (
                    <ExerciseCard key={ex.id} ex={ex} index={i} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'trace' && (
              <DSATrace trace={plan.dsa_trace} graphData={plan.graph_data} history={plan.history} />
            )}

            {activeTab === 'history' && (
              <HistoryTab history={history} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
