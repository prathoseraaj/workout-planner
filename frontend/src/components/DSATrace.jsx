import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RiFilterLine, RiDatabase2Line, RiNodeTree, RiShareCircleLine, RiLightbulbLine, RiLink } from 'react-icons/ri';
import './DSATrace.css';

function StepBadge({ step, label, color }) {
  return (
    <div className="step-badge" style={{ '--step-color': color }}>
      <span className="step-num">{step}</span>
      <span className="step-label">{label}</span>
    </div>
  );
}

function TraceCard({ icon, title, color, children }) {
  return (
    <div className="trace-card" style={{ '--trace-color': color }}>
      <div className="trace-card-header">
        <span className="trace-icon">{icon}</span>
        <h4 className="trace-title">{title}</h4>
        <div className="trace-glow" />
      </div>
      <div className="trace-card-body">{children}</div>
    </div>
  );
}

function ComplexityChip({ label, value }) {
  return (
    <div className="complexity-chip">
      <span className="complexity-label">{label}</span>
      <span className="complexity-value">{value}</span>
    </div>
  );
}

function BitmaskVisual({ mask, binary }) {
  const bits = binary.replace('0b', '').padStart(8, '0').split('');
  const LABELS = ['BW', 'DB', 'BB', 'PB', 'RB', 'KB', 'CM', 'BN'];
  return (
    <div className="bitmask-visual">
      {bits.map((bit, i) => (
        <div key={i} className={`bitmask-cell ${bit === '1' ? 'bitmask-cell--on' : 'bitmask-cell--off'}`}>
          <span className="bitmask-bit">{bit}</span>
          <span className="bitmask-bit-label">{LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function GraphVisual({ graphData }) {
  if (!graphData || !graphData.nodes) return null;

  const MUSCLE_COLORS = {
    Chest:     '#888888',
    Back:      '#aaaaaa',
    Shoulders: '#777777',
    Legs:      '#999999',
    Core:      '#bbbbbb',
    Arms:      '#888888',
    Cardio:    '#aaaaaa',
  };

  // Group nodes by muscle
  const groups = {};
  graphData.nodes.forEach(n => {
    if (!groups[n.group]) groups[n.group] = [];
    groups[n.group].push(n);
  });

  return (
    <div className="graph-visual">
      {Object.entries(groups).map(([group, nodes]) => (
        <div key={group} className="graph-group">
          <span className="graph-group-label" style={{ color: MUSCLE_COLORS[group] || '#888888' }}>
            {group}
          </span>
          <div className="graph-nodes">
            {nodes.map(n => (
              <div
                key={n.id}
                className="graph-node"
                style={{
                  borderColor: MUSCLE_COLORS[n.group] || '#555555',
                }}
              >
                <span className="graph-node-id">#{n.id}</span>
                <span className="graph-node-name">{n.label}</span>
                <div className="graph-difficulty-dots">
                  {[1,2,3].map(d => (
                    <span key={d} className={`graph-dot ${d <= n.difficulty ? 'graph-dot--on' : 'graph-dot--off'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="graph-edge-count">
        <span><RiLink size={11} style={{marginRight:4}} />{graphData.edges.length} edges</span>
        <span>{graphData.nodes.length} nodes</span>
        <span>Scale: ×{graphData.edge_scale}</span>
      </div>
    </div>
  );
}

function KnapsackBar({ trace }) {
  const data = [
    { name: 'Exercises (n)', value: trace.n_exercises, color: '#666666' },
    { name: 'Capacity (W)', value: trace.capacity_units, color: '#888888' },
    { name: 'Selected', value: trace.selected_count, color: '#cccccc' },
    { name: 'Calories', value: trace.total_calories, color: '#aaaaaa' },
  ];

  return (
    <div className="knapsack-bar">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <XAxis dataKey="name" tick={{ fill: '#666666', fontSize: 10 }} />
          <YAxis tick={{ fill: '#666666', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#ffffff', fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HistoryPanel({ history }) {
  const days = [
    { label: 'Today',     ids: history.today,        color: '#ffffff' },
    { label: 'Yesterday', ids: history.yesterday,     color: '#aaaaaa' },
    { label: '2 Days Ago',ids: history.two_days_ago, color: '#666666' },
  ];

  return (
    <div className="history-panel">
      {days.map(d => (
        <div key={d.label} className="history-row">
          <span className="history-day" style={{ color: d.color }}>{d.label}</span>
          {d.ids.length === 0 ? (
            <span className="history-empty">No session</span>
          ) : (
            <div className="history-ids">
              {d.ids.map(id => (
                <span key={id} className="history-id" style={{ borderColor: d.color }}>#{id}</span>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="history-note">
        <RiLightbulbLine size={12} style={{marginRight:5,verticalAlign:'middle'}} />
        Exercises from <strong>Yesterday</strong> receive a 40% value penalty in the
        Knapsack DP to avoid repeating the same session.
      </p>
    </div>
  );
}

export default function DSATrace({ trace, graphData, history }) {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    { key: 'step1_bitmask',  num: '01', label: 'Bitmask Filter', icon: <RiFilterLine />,     color: '#ffffff' },
    { key: 'step2_hashmap',  num: '02', label: 'HashMap Lookup', icon: <RiDatabase2Line />,   color: '#cccccc' },
    { key: 'step3_knapsack', num: '03', label: 'Knapsack DP',    icon: <RiNodeTree />,        color: '#aaaaaa' },
    { key: 'step4_graph',    num: '04', label: 'Graph BFS',      icon: <RiShareCircleLine />, color: '#888888' },
  ];

  return (
    <div className="dsa-trace fade-in-up">
      {/* Pipeline flow */}
      <div className="pipeline-flow">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <StepBadge step={s.num} label={s.label} color={s.color} />
            {i < steps.length - 1 && <div className="pipeline-arrow">→</div>}
          </React.Fragment>
        ))}
      </div>

      {/* Step cards */}
      <div className="trace-cards">
        {/* Step 1: Bitmask */}
        <TraceCard icon={<RiFilterLine />} title="Step 1: Bitmask Equipment Filter" color="#ffffff">
          <div className="trace-desc">{trace.step1_bitmask.description}</div>
          <BitmaskVisual
            mask={trace.step1_bitmask.user_equipment_mask}
            binary={trace.step1_bitmask.user_equipment_mask.match(/binary: (.+?)\)/)?.[1] || '0b00000000'}
          />
          <div className="trace-stats">
            <div className="trace-stat">
              <span className="ts-val">{trace.step1_bitmask.exercises_before_filter}</span>
              <span className="ts-lbl">Before Filter</span>
            </div>
            <div className="ts-arrow">→</div>
            <div className="trace-stat">
              <span className="ts-val" style={{ color: '#ffffff' }}>{trace.step1_bitmask.exercises_after_filter}</span>
              <span className="ts-lbl">After Filter</span>
            </div>
          </div>
          <ComplexityChip label="Time" value={trace.step1_bitmask.complexity} />
        </TraceCard>

        {/* Step 2: HashMap */}
        <TraceCard icon={<RiDatabase2Line />} title="Step 2: HashMap History Deduplication" color="#cccccc">
          <div className="trace-desc">{trace.step2_hashmap.description}</div>
          <HistoryPanel history={history} />
          <ComplexityChip label="Time" value={trace.step2_hashmap.complexity} />
        </TraceCard>

        {/* Step 3: Knapsack */}
        <TraceCard icon={<RiNodeTree />} title="Step 3: Bounded Knapsack DP" color="#aaaaaa">
          <div className="trace-desc">{trace.step3_knapsack.algorithm}</div>
          <KnapsackBar trace={trace.step3_knapsack} />
          <div className="trace-meta-grid">
            <div className="trace-meta-item">
              <span className="tm-label">DP Table</span>
              <span className="tm-value">{trace.step3_knapsack.dp_table_size}</span>
            </div>
            <div className="trace-meta-item">
              <span className="tm-label">Level Multiplier</span>
              <span className="tm-value">×{trace.step3_knapsack.level_multiplier}</span>
            </div>
            <div className="trace-meta-item">
              <span className="tm-label">Fitness Level</span>
              <span className="tm-value">{trace.step3_knapsack.fitness_level}</span>
            </div>
            <div className="trace-meta-item">
              <span className="tm-label">Total Calories</span>
              <span className="tm-value">{trace.step3_knapsack.total_calories}</span>
            </div>
          </div>
          <ComplexityChip label="Time" value={trace.step3_knapsack.time_complexity} />
          <ComplexityChip label="Space" value={trace.step3_knapsack.space_complexity} />
        </TraceCard>

        {/* Step 4: Graph */}
        <TraceCard icon={<RiShareCircleLine />} title="Step 4: Exercise Graph BFS Session Ordering" color="#888888">
          <div className="trace-desc">{trace.step4_graph.description}</div>
          <GraphVisual graphData={graphData} />
          <div className="trace-meta-grid">
            <div className="trace-meta-item">
              <span className="tm-label">Nodes (V)</span>
              <span className="tm-value">{trace.step4_graph.nodes}</span>
            </div>
            <div className="trace-meta-item">
              <span className="tm-label">Edges (E)</span>
              <span className="tm-value">{trace.step4_graph.edges}</span>
            </div>
            <div className="trace-meta-item">
              <span className="tm-label">Edge Weight Scale</span>
              <span className="tm-value">×{trace.step4_graph.fitness_edge_scale}</span>
            </div>
          </div>
          <ComplexityChip label="Time" value={trace.step4_graph.complexity} />
        </TraceCard>
      </div>
    </div>
  );
}
