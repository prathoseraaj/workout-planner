import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { checkUserExists, getUser } from './api';
import { RiCpuLine, RiExternalLinkLine, RiBugLine, RiRadioButtonLine } from 'react-icons/ri';
import './App.css';

function Navbar({ user }) {
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="nav-logo">
          <span className="nav-logo-icon">
            <RiCpuLine />
          </span>
          <span className="nav-logo-text">
            Fit<span>DSA</span>
          </span>
          <span className="nav-logo-tag">Workout Engine</span>
        </div>

        <div className="nav-links">
          {user && (
            <span className="nav-user">
              <span className="nav-avatar">{user.name?.[0]?.toUpperCase()}</span>
              {user.name}
            </span>
          )}
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="nav-link">
            <RiExternalLinkLine size={13} /> API Docs
          </a>
          <a href="http://localhost:8000/debug/bitmask" target="_blank" rel="noreferrer" className="nav-link">
            <RiBugLine size={13} /> Debug
          </a>
          <span className="nav-status">
            <span className="status-dot" />
            Online
          </span>
        </div>
      </div>
    </nav>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p>Initializing Fitness Engine…</p>
    </div>
  );
}

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    checkUserExists()
      .then(async res => {
        if (res.data.exists) {
          const userRes = await getUser();
          setUser(userRes.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOnboardingComplete = (savedUser) => {
    setUser(savedUser);
    setEditing(false);
  };

  const showOnboarding = !user || editing;

  if (loading) return <LoadingScreen />;

  return (
    <div className="app">
      <Navbar user={user} />

      <main className="main">
        {showOnboarding ? (
          <Onboarding
            onComplete={handleOnboardingComplete}
            existingData={editing ? user : null}
          />
        ) : (
          <Dashboard
            initialUser={user}
            onEditProfile={() => setEditing(true)}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>FitDSA — Personalized Workout Planning</span>
          <div className="footer-chips">
            <span className="footer-chip">Bitmask O(n)</span>
            <span className="footer-chip">Knapsack O(n×W)</span>
            <span className="footer-chip">Graph BFS O(V+E)</span>
            <span className="footer-chip">SQLite Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
