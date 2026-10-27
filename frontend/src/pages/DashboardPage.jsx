import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { AlertTriangle, Users, Clock, Activity, ArrowRight, UserCheck, RefreshCw, Zap } from 'lucide-react';

export default function DashboardPage({ setActiveTab }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextPatientResult, setNextPatientResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getTriageStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load triage status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDequeueNext = async () => {
    try {
      setActionLoading(true);
      const res = await api.dequeueNext();
      setNextPatientResult(res);
      await loadStatus();
    } catch (err) {
      alert(`Error summoning patient: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const priorityItems = status?.priority_queue?.items || [];
  const routineItems = status?.routine_queue?.items || [];
  const priorityCount = status?.priority_queue?.length || 0;
  const routineCount = status?.routine_queue?.length || 0;
  const totalWaiting = status?.total_waiting || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="keyword-chip">Command</span> Overview
          </h1>
          <p className="page-subtitle">
            Real-time emergency triage monitoring and appointment queue processor (CO1: Heap & FIFO Queue)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={loadStatus} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={handleDequeueNext} disabled={actionLoading || totalWaiting === 0}>
            <UserCheck size={16} /> Summon Next Patient
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card featured-pink">
          <div className="stat-label">
            <AlertTriangle size={16} color="var(--color-accent-pink)" /> Emergency Priority Queue
          </div>
          <div className="stat-val" style={{ color: 'var(--color-accent-pink)' }}>
            {priorityCount}
          </div>
          <div className="stat-hint">
            Max-Heap ordered by condition severity (1-10). Critical cases dequeued first.
          </div>
        </div>

        <div className="stat-card featured-lime">
          <div className="stat-label">
            <Clock size={16} color="var(--color-accent-lime)" /> Routine Appointment Queue
          </div>
          <div className="stat-val" style={{ color: 'var(--color-accent-lime)' }}>
            {routineCount}
          </div>
          <div className="stat-hint">
            Strict FIFO order. Routine consultations handled systematically.
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Users size={16} /> Total Waiting Pool
          </div>
          <div className="stat-val">
            {totalWaiting}
          </div>
          <div className="stat-hint">
            Next up: {priorityCount > 0 ? 'Emergency Resuscitation' : (routineCount > 0 ? 'Routine Consult' : 'Idle')}
          </div>
        </div>
      </div>

      {/* Summoned Notification Modal/Banner */}
      {nextPatientResult && nextPatientResult.patient && (
        <div className="sentry-card" style={{ marginBottom: '24px', borderColor: 'var(--color-accent-lime)', background: 'linear-gradient(90deg, rgba(194,239,78,0.12) 0%, var(--color-surface-card) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-accent-lime)', color: '#150f23', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                <Zap size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--color-accent-lime)', fontWeight: 700 }}>
                  Summoned to Treatment Bay // {nextPatientResult.source_queue}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {nextPatientResult.patient.name} (ID: #{nextPatientResult.patient.id})
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                  Condition: <strong>{nextPatientResult.patient.primary_condition}</strong> | Severity: <span className="badge badge-emergency">{nextPatientResult.patient.severity}/10</span> | Dept: {nextPatientResult.patient.department}
                </div>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => setNextPatientResult(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Queue Details Two-Column Layout */}
      <div className="grid-2">
        {/* Emergency Max-Heap Priority Queue */}
        <div className="sentry-card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--color-accent-pink)" />
              Emergency Priority Queue (Max-Heap)
            </span>
            <span className="badge badge-emergency">{priorityCount} Waiting</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-on-dark-muted)', marginBottom: 14 }}>
            Implemented with custom array-based binary heap (<code className="badge-code">O(log n)</code> dequeue).
          </p>

          <div className="table-container">
            <table className="sentry-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Patient</th>
                  <th>Condition</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {priorityItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-on-dark-muted)', padding: '24px' }}>
                      No emergency patients currently waiting.
                    </td>
                  </tr>
                ) : (
                  priorityItems.map((item, idx) => {
                    const p = item.data;
                    return (
                      <tr key={idx}>
                        <td>
                          <span className="badge badge-code">#{idx + 1}</span>
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: 11, color: 'var(--color-on-dark-muted)' }}>ID: {p.id}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{p.primary_condition}</td>
                        <td>
                          <span className="badge badge-emergency">Sev: {item.severity}/10</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Routine FIFO Queue */}
        <div className="sentry-card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-accent-lime)" />
              Routine Appointment Queue (FIFO)
            </span>
            <span className="badge badge-routine">{routineCount} Scheduled</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-on-dark-muted)', marginBottom: 14 }}>
            Implemented with custom linked-node queue (<code className="badge-code">O(1)</code> FIFO enqueue/dequeue).
          </p>

          <div className="table-container">
            <table className="sentry-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {routineItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-on-dark-muted)', padding: '24px' }}>
                      No routine appointment patients in queue.
                    </td>
                  </tr>
                ) : (
                  routineItems.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="badge badge-code">P-{idx + 1}</span>
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--color-on-dark-muted)' }}>ID: {p.id}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{p.department || 'Outpatient'}</td>
                      <td style={{ fontSize: 12 }}>{p.primary_condition}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="sentry-squiggle" />

      {/* Quick Launchpad */}
      <div className="sentry-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Want to intake a new patient or test AI diagnosis?</div>
          <div style={{ fontSize: 13, color: 'var(--color-on-dark-muted)' }}>
            Jump to Triage to walk through the Binary Tree symptom classifier and dynamically route to queues.
          </div>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('triage')}>
          Go To Triage Form <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
