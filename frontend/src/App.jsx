import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  History,
  Share2,
  BarChart3,
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import { api } from './api';

import DashboardPage from './pages/DashboardPage';
import TriagePage from './pages/TriagePage';
import PatientsPage from './pages/PatientsPage';
import VisitHistoryPage from './pages/VisitHistoryPage';
import DiseaseTrackerPage from './pages/DiseaseTrackerPage';
import PerformancePage from './pages/PerformancePage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(1);
  const [queueStats, setQueueStats] = useState({ priority: 0, routine: 0 });
  const [theme, setTheme] = useState('light'); // Default to light mode

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getTriageStatus();
        setQueueStats({
          priority: data?.priority_queue?.length || 0,
          routine: data?.routine_queue?.length || 0,
        });
      } catch (e) {
        // quiet error on initial boot
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-logo-icon">M</div>
          <div style={{ flexGrow: 1 }}>
            <div className="brand-title">
              MediTree <span className="brand-chip">DSA</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', letterSpacing: 0.2 }}>
              Hospital Intelligence Suite
            </div>
          </div>
        </div>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
              {queueStats.priority > 0 && (
                <span className="nav-badge alert">{queueStats.priority} Crit</span>
              )}
            </button>
          </li>

          <li>
            <button
              className={`nav-item-btn ${activeTab === 'triage' ? 'active' : ''}`}
              onClick={() => setActiveTab('triage')}
            >
              <Stethoscope size={17} />
              <span>Triage & AI Diagnosis</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-item-btn ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveTab('patients')}
            >
              <Users size={17} />
              <span>Patients & Records</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-item-btn ${activeTab === 'visits' ? 'active' : ''}`}
              onClick={() => setActiveTab('visits')}
            >
              <History size={17} />
              <span>Visit History (DLL)</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-item-btn ${activeTab === 'disease' ? 'active' : ''}`}
              onClick={() => setActiveTab('disease')}
            >
              <Share2 size={17} />
              <span>Disease Tracker (Graph)</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-item-btn ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              <BarChart3 size={17} />
              <span>Performance Suite</span>
            </button>
          </li>
        </ul>

        {/* Sidebar Footer with Theme Toggle & Status */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>API Live</span>
            </div>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title="Toggle Light / Dark mode"
            >
              {theme === 'light' ? (
                <>
                  <Moon size={13} /> Dark
                </>
              ) : (
                <>
                  <Sun size={13} /> Light
                </>
              )}
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
            DSA Micro-Project IA3 // CO1–CO5
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'triage' && (
          <TriagePage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'patients' && (
          <PatientsPage
            setActiveTab={setActiveTab}
            setSelectedPatientId={setSelectedPatientId}
          />
        )}

        {activeTab === 'visits' && (
          <VisitHistoryPage
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
          />
        )}

        {activeTab === 'disease' && (
          <DiseaseTrackerPage />
        )}

        {activeTab === 'performance' && (
          <PerformancePage />
        )}
      </main>
    </div>
  );
}
