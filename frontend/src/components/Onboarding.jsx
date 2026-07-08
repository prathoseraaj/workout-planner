import React, { useState } from 'react';
import { setupUser } from '../api';
import {
  RiUserLine,
  RiBarChartBoxLine,
  RiToolsLine,
  RiBodyScanLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiFlashlightLine,
  RiTimeLine,
  RiFireLine,
  RiHeartPulseLine,
  RiMedalLine,
  RiAlertLine,
  RiRocketLine,
} from 'react-icons/ri';
import { GiWeightLiftingUp, GiBodyBalance, GiMuscleUp } from 'react-icons/gi';
import './Onboarding.css';

// ── Constants ────────────────────────────────────────────────────────────────

const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight',       label: 'Bodyweight',       icon: <GiBodyBalance />,     bit: 1   },
  { id: 'dumbbells',        label: 'Dumbbells',         icon: <GiWeightLiftingUp />, bit: 2   },
  { id: 'barbell',          label: 'Barbell',           icon: <RiToolsLine />,       bit: 4   },
  { id: 'pullup_bar',       label: 'Pull-up Bar',       icon: <RiBodyScanLine />,    bit: 8   },
  { id: 'resistance_bands', label: 'Resistance Bands',  icon: <RiFlashlightLine />,  bit: 16  },
  { id: 'kettlebell',       label: 'Kettlebell',        icon: <GiMuscleUp />,        bit: 32  },
  { id: 'cable_machine',    label: 'Cable Machine',     icon: <RiBarChartBoxLine />, bit: 64  },
  { id: 'bench',            label: 'Bench',             icon: <RiMedalLine />,       bit: 128 },
];

const MUSCLE_OPTIONS = [
  { id: 'Chest' },
  { id: 'Back' },
  { id: 'Shoulders' },
  { id: 'Legs' },
  { id: 'Core' },
  { id: 'Arms' },
  { id: 'Cardio' },
];

const GOALS = [
  { id: 'weight_loss', label: 'Weight Loss',  icon: <RiFireLine />,       desc: 'Burn fat & slim down' },
  { id: 'muscle_gain', label: 'Muscle Gain',  icon: <GiMuscleUp />,       desc: 'Build size & strength' },
  { id: 'endurance',   label: 'Endurance',    icon: <RiHeartPulseLine />, desc: 'Cardio & stamina' },
  { id: 'strength',    label: 'Strength',     icon: <GiWeightLiftingUp />, desc: 'Raw power & lifts' },
];

const FITNESS_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Just starting out, new to structured training' },
  { id: 'intermediate', label: 'Intermediate', desc: '6–24 months of consistent training' },
  { id: 'advanced',     label: 'Advanced',     desc: '2+ years, comfortable with complex lifts' },
];

// ── Step Components ──────────────────────────────────────────────────────────

function StepPersonal({ data, onChange }) {
  const bmi = data.weight_kg && data.height_cm
    ? (data.weight_kg / ((data.height_cm / 100) ** 2)).toFixed(1)
    : null;
  const bmiCat = bmi
    ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
    : null;

  return (
    <div className="step-body">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Alex Johnson"
            value={data.name}
            onChange={e => onChange('name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Age</label>
          <input
            className="form-input"
            type="number"
            placeholder="25"
            min="10" max="100"
            value={data.age}
            onChange={e => onChange('age', parseInt(e.target.value) || '')}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input
            className="form-input"
            type="number"
            placeholder="70"
            step="0.1"
            value={data.weight_kg}
            onChange={e => onChange('weight_kg', parseFloat(e.target.value) || '')}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Height (cm)</label>
          <input
            className="form-input"
            type="number"
            placeholder="175"
            step="0.1"
            value={data.height_cm}
            onChange={e => onChange('height_cm', parseFloat(e.target.value) || '')}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Gender</label>
        <div className="gender-row">
          {['male', 'female', 'other'].map(g => (
            <button
              key={g}
              className={`gender-btn ${data.gender === g ? 'gender-btn--active' : ''}`}
              onClick={() => onChange('gender', g)}
              type="button"
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {bmi && (
        <div className="bmi-preview">
          <span className="bmi-label">Live BMI Preview</span>
          <span className="bmi-value">{bmi}</span>
          <span className="bmi-cat">{bmiCat}</span>
        </div>
      )}
    </div>
  );
}

function StepFitness({ data, onChange }) {
  return (
    <div className="step-body">
      <div className="form-group">
        <label className="form-label">Fitness Level</label>
        <div className="level-cards">
          {FITNESS_LEVELS.map(lvl => (
            <button
              key={lvl.id}
              className={`level-card ${data.fitness_level === lvl.id ? 'level-card--active' : ''}`}
              onClick={() => onChange('fitness_level', lvl.id)}
              type="button"
            >
              <span className="level-name">{lvl.label}</span>
              <span className="level-desc">{lvl.desc}</span>
              <div className="level-dsa-note">
                Knapsack: ×{lvl.id === 'beginner' ? '1.5' : lvl.id === 'intermediate' ? '1.0' : '0.75'}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Primary Goal</label>
        <div className="goal-grid">
          {GOALS.map(g => (
            <button
              key={g.id}
              className={`goal-card ${data.goal === g.id ? 'goal-card--active' : ''}`}
              onClick={() => onChange('goal', g.id)}
              type="button"
            >
              <span className="goal-icon">{g.icon}</span>
              <span className="goal-label">{g.label}</span>
              <span className="goal-desc">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">
          Available Time per Session
        </label>
        <div className="time-slider-wrap">
          <RiTimeLine size={16} color="var(--gray-400)" />
          <input
            type="range"
            className="time-slider"
            min="15" max="120" step="5"
            value={data.available_minutes}
            onChange={e => onChange('available_minutes', parseInt(e.target.value))}
          />
          <span className="time-value">{data.available_minutes}<span style={{fontSize:11}}> min</span></span>
        </div>
        <div className="time-dsa">
          Knapsack W = {data.available_minutes} × 60 / 3 = <strong>{Math.round(data.available_minutes * 60 / 3)}</strong> fatigue units
        </div>
      </div>
    </div>
  );
}

function StepEquipment({ data, onChange }) {
  const toggle = (id) => {
    const current = data.equipment;
    const next = current.includes(id)
      ? current.filter(e => e !== id)
      : [...current, id];
    if (!next.includes('bodyweight')) next.unshift('bodyweight');
    onChange('equipment', next);
  };

  const mask = EQUIPMENT_OPTIONS
    .filter(e => data.equipment.includes(e.id))
    .reduce((acc, e) => acc | e.bit, 0);

  return (
    <div className="step-body">
      <p className="step-hint">Select all equipment you have access to. Bodyweight is always included.</p>
      <div className="equipment-grid">
        {EQUIPMENT_OPTIONS.map(eq => (
          <button
            key={eq.id}
            className={`equip-btn ${data.equipment.includes(eq.id) ? 'equip-btn--active' : ''}`}
            onClick={() => toggle(eq.id)}
            disabled={eq.id === 'bodyweight'}
            type="button"
          >
            <span className="equip-icon">{eq.icon}</span>
            <span className="equip-label">{eq.label}</span>
            <span className="equip-bit">bit {Math.log2(eq.bit)}</span>
          </button>
        ))}
      </div>

      <div className="live-bitmask">
        <span className="bitmask-title">Equipment Bitmask</span>
        <div className="bitmask-row">
          {EQUIPMENT_OPTIONS.map(eq => (
            <div
              key={eq.id}
              className={`mask-cell ${data.equipment.includes(eq.id) ? 'mask-cell--on' : 'mask-cell--off'}`}
            >
              <span className="mask-bit">{data.equipment.includes(eq.id) ? '1' : '0'}</span>
              <span className="mask-lbl">{eq.label.split(' ')[0].slice(0,3)}</span>
            </div>
          ))}
        </div>
        <div className="bitmask-decimal">
          = <strong>{mask}</strong> (decimal) &nbsp;|&nbsp;
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {bin8(mask)}
          </span> (binary)
        </div>
      </div>
    </div>
  );
}

function StepMuscles({ data, onChange }) {
  const toggle = (id) => {
    const current = data.target_muscles;
    const next = current.includes(id)
      ? current.filter(m => m !== id)
      : [...current, id];
    onChange('target_muscles', next);
  };
  return (
    <div className="step-body">
      <p className="step-hint">
        Select target muscle groups. Selected muscles get a 40% value bonus in the Knapsack DP.
      </p>
      <div className="muscle-grid">
        {MUSCLE_OPTIONS.map(m => (
          <button
            key={m.id}
            className={`muscle-btn ${data.target_muscles.includes(m.id) ? 'muscle-btn--active' : ''}`}
            onClick={() => toggle(m.id)}
            type="button"
          >
            <span className="muscle-name">{m.id}</span>
            {data.target_muscles.includes(m.id) && (
              <span className="muscle-bonus">+40% DP</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Utils ────────────────────────────────────────────────────────────────────

function bin8(n) { return '0b' + n.toString(2).padStart(8, '0'); }

// ── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'personal',  title: 'About You',       subtitle: 'Personal details', icon: <RiUserLine /> },
  { id: 'fitness',   title: 'Fitness Profile', subtitle: 'Level & goal',     icon: <RiBarChartBoxLine /> },
  { id: 'equipment', title: 'Equipment',       subtitle: 'Builds bitmask',   icon: <RiToolsLine /> },
  { id: 'muscles',   title: 'Target Muscles',  subtitle: 'DP priority',      icon: <RiBodyScanLine /> },
];

const DEFAULT_DATA = {
  name:              '',
  age:               '',
  weight_kg:         '',
  height_cm:         '',
  gender:            'male',
  fitness_level:     'intermediate',
  goal:              'muscle_gain',
  available_minutes: 45,
  equipment:         ['bodyweight'],
  target_muscles:    ['Chest', 'Back'],
};

// ── Main Onboarding Component ────────────────────────────────────────────────

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, val) => setData(d => ({ ...d, [key]: val }));

  const canProceed = () => {
    if (step === 0) return data.name && data.age && data.weight_kg && data.height_cm;
    if (step === 1) return data.fitness_level && data.goal && data.available_minutes;
    if (step === 2) return data.equipment.length > 0;
    if (step === 3) return data.target_muscles.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name:              data.name.trim(),
        age:               parseInt(data.age),
        weight_kg:         parseFloat(data.weight_kg),
        height_cm:         parseFloat(data.height_cm),
        gender:            data.gender,
        fitness_level:     data.fitness_level,
        goal:              data.goal,
        available_minutes: data.available_minutes,
        equipment:         data.equipment,
        target_muscles:    data.target_muscles,
      };
      const res = await setupUser(payload);
      onComplete(res.data.user);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Setup failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 0) return <StepPersonal  data={data} onChange={update} />;
    if (step === 1) return <StepFitness   data={data} onChange={update} />;
    if (step === 2) return <StepEquipment data={data} onChange={update} />;
    if (step === 3) return <StepMuscles   data={data} onChange={update} />;
  };

  const progress = ((step) / STEPS.length) * 100;

  return (
    <div className="onboarding">
      <div className="ob-card">
        {/* Header */}
        <div className="ob-header">
          <div className="ob-logo-row">
            <RiRocketLine size={20} />
            <span>FitDSA</span>
          </div>
          <h1 className="ob-title">Build Your Personal Engine</h1>
          <p className="ob-subtitle">
            Your details power all 4 DSA algorithms — different inputs, different optimal workouts.
          </p>
        </div>

        {/* Progress bar */}
        <div className="ob-progress-wrap">
          <div className="ob-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Step indicators */}
        <div className="ob-steps">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`ob-step ${i === step ? 'ob-step--active' : i < step ? 'ob-step--done' : ''}`}>
              <div className="ob-step-icon">
                {i < step ? <RiCheckLine /> : s.icon}
              </div>
              <div className="ob-step-info">
                <span className="ob-step-title">{s.title}</span>
                <span className="ob-step-sub">{s.subtitle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="ob-content">
          <div className="ob-step-header">
            <span className="ob-step-num">Step {step + 1} of {STEPS.length}</span>
            <h2 className="ob-step-label">{STEPS[step].title}</h2>
          </div>
          {renderStep()}
        </div>

        {/* Error */}
        {error && (
          <div className="ob-error">
            <RiAlertLine size={15} />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="ob-nav">
          <button
            className="btn btn-ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <RiArrowLeftLine size={14} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
            >
              Continue <RiArrowRightLine size={14} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <><div className="spinner" style={{width:15,height:15,borderWidth:2}} /> Saving...</>
              ) : <><RiRocketLine size={14} /> Start Training</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
