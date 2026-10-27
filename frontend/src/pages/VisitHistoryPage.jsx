import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { History, ChevronLeft, ChevronRight, SkipBack, SkipForward, Plus, FileText, User, HeartPulse, Pill, Calendar, ArrowLeftRight } from 'lucide-react';

export default function VisitHistoryPage({ selectedPatientId, setSelectedPatientId }) {
  const [patientId, setPatientId] = useState(selectedPatientId || 1);
  const [patientsList, setPatientsList] = useState([]);
  const [visitsData, setVisitsData] = useState(null);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navLoading, setNavLoading] = useState(false);

  // New Visit Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVisit, setNewVisit] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    doctor_name: 'Dr. Marcus Vance',
    diagnosis: 'Follow-up Evaluation & Stabilization',
    prescription: 'Rx: Amoxicillin 500mg TDS, Paracetamol 650mg SOS',
    notes: 'Patient shows consistent clinical improvement. Vitals within expected normal tolerances.',
    vitals: 'BP: 122/82 | HR: 74 bpm | Temp: 98.4°F | SpO2: 99%'
  });

  // Load patients list for dropdown
  useEffect(() => {
    api.getPatients('id', 'asc')
      .then(res => setPatientsList(res.results || []))
      .catch(console.error);
  }, []);

  const loadVisits = async (pId) => {
    try {
      setLoading(true);
      const data = await api.getVisits(pId);
      setVisitsData(data);
      setCurrentCursor(data.current_cursor);
    } catch (err) {
      console.error('Failed to load visits', err);
      setVisitsData(null);
      setCurrentCursor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadVisits(patientId);
    }
  }, [patientId]);

  const handleNavigate = async (action) => {
    try {
      setNavLoading(true);
      const res = await api.navigateVisits(patientId, action);
      setCurrentCursor(res.node);
    } catch (err) {
      alert(`Navigation error: ${err.message}`);
    } finally {
      setNavLoading(false);
    }
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    try {
      await api.addVisit(patientId, newVisit);
      setShowAddForm(false);
      await loadVisits(patientId);
    } catch (err) {
      alert(`Failed to add visit log: ${err.message}`);
    }
  };

  const currentVisitData = currentCursor?.data || null;
  const hasPrev = currentCursor?.has_prev || false;
  const hasNext = currentCursor?.has_next || false;
  const prevId = currentCursor?.prev_id;
  const nextId = currentCursor?.next_id;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Patient Visit <span className="keyword-chip">History</span>
          </h1>
          <p className="page-subtitle">
            Bidirectional Doubly Linked List (CO2: pointer-based sequential memory allocation & O(1) prev/next navigation)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>Select Patient:</label>
          <select
            className="form-select"
            value={patientId}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              setPatientId(id);
              if (setSelectedPatientId) setSelectedPatientId(id);
            }}
            style={{ width: '220px' }}
          >
            {patientsList.map(p => (
              <option key={p.id} value={p.id}>
                #{p.id} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="sentry-card" style={{ textAlign: 'center', padding: '60px' }}>
          Traversing Doubly Linked List pointers...
        </div>
      ) : (
        <div>
          {/* Doubly Linked List Pointer HUD */}
          <div className="sentry-card" style={{ marginBottom: '24px', background: 'var(--color-surface-subtle)' }}>
            <div className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeftRight size={18} color="var(--color-accent-lime)" />
                Doubly Linked List Pointer Architecture
              </span>
              <span className="badge badge-code">
                Total Nodes: {visitsData?.total_visits || 0}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px 0', flexWrap: 'wrap' }}>
              {/* Prev Pointer Box */}
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 8,
                  border: '1px dashed var(--color-hairline)',
                  background: hasPrev ? 'var(--color-surface-card)' : 'transparent',
                  textAlign: 'center',
                  opacity: hasPrev ? 1 : 0.4
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontFamily: 'var(--font-family-mono)' }}>
                  PREV POINTER
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                  {hasPrev ? `Node #${prevId}` : 'NULL'}
                </div>
              </div>

              {/* Left Arrow */}
              <div style={{ color: hasPrev ? 'var(--color-accent-lime)' : 'var(--color-ink-muted)', fontSize: 18, fontWeight: 700 }}>
                &lt;---
              </div>

              {/* Current Active Node */}
              <div
                style={{
                  padding: '16px 28px',
                  borderRadius: 10,
                  border: '2px solid var(--color-accent-lime)',
                  background: 'var(--color-accent-lime-bg)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--color-accent-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
                  ACTIVE POINTER (CURRENT CURSOR)
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: 'var(--color-ink)' }}>
                  Visit Node #{currentVisitData?.id || 'N/A'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 2 }}>
                  {currentVisitData?.visit_date}
                </div>
              </div>

              {/* Right Arrow */}
              <div style={{ color: hasNext ? 'var(--color-accent-lime)' : 'var(--color-ink-muted)', fontSize: 18, fontWeight: 700 }}>
                ---&gt;
              </div>

              {/* Next Pointer Box */}
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 8,
                  border: '1px dashed var(--color-hairline)',
                  background: hasNext ? 'var(--color-surface-card)' : 'transparent',
                  textAlign: 'center',
                  opacity: hasNext ? 1 : 0.4
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontFamily: 'var(--font-family-mono)' }}>
                  NEXT POINTER
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                  {hasNext ? `Node #${nextId}` : 'NULL'}
                </div>
              </div>
            </div>

            {/* Stepper Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => handleNavigate('reset_head')}
                disabled={navLoading || !hasPrev}
                title="Jump to First Node (Head)"
              >
                <SkipBack size={14} /> Head
              </button>
              <button
                className="btn-primary"
                onClick={() => handleNavigate('prev')}
                disabled={navLoading || !hasPrev}
              >
                <ChevronLeft size={16} /> Previous Visit (prev)
              </button>
              <button
                className="btn-primary"
                onClick={() => handleNavigate('next')}
                disabled={navLoading || !hasNext}
              >
                Next Visit (next) <ChevronRight size={16} />
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleNavigate('reset_tail')}
                disabled={navLoading || !hasNext}
                title="Jump to Latest Node (Tail)"
              >
                Tail <SkipForward size={14} />
              </button>
            </div>
          </div>

          {/* Active Visit Detailed Card */}
          {currentVisitData ? (
            <div className="sentry-card" style={{ marginBottom: '24px' }}>
              <div className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--color-accent-lime)" />
                  Clinical Visit Examination Record
                </span>
                <span className="badge badge-code">Visit #{currentVisitData.id}</span>
              </div>

              <div className="grid-3" style={{ marginBottom: '20px' }}>
                <div style={{ background: 'var(--color-surface-subtle)', padding: '14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>Visit Date</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink)' }}>
                    <Calendar size={14} color="var(--color-accent-lime)" /> {currentVisitData.visit_date}
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface-subtle)', padding: '14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>Attending Physician</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink)' }}>
                    <User size={14} color="var(--color-accent-lime)" /> {currentVisitData.doctor_name}
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface-subtle)', padding: '14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>Diagnosis / Assessment</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: 'var(--color-ink)' }}>
                    {currentVisitData.diagnosis}
                  </div>
                </div>
              </div>

              {/* Vitals Ribbon */}
              <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-hairline)', padding: '14px 18px', borderRadius: 8, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <HeartPulse size={20} color="var(--color-accent-pink)" />
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700 }}>Recorded Physiological Vitals</div>
                  <div style={{ fontSize: 14, fontFamily: 'var(--font-family-mono)', marginTop: 2, color: 'var(--color-ink)', fontWeight: 600 }}>
                    {currentVisitData.vitals}
                  </div>
                </div>
              </div>

              {/* Prescriptions & Notes */}
              <div className="grid-2">
                <div style={{ background: 'var(--color-surface-subtle)', padding: '16px', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink)' }}>
                    <Pill size={15} color="var(--color-accent-pink)" /> Medication Prescriptions:
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                    {currentVisitData.prescription || 'No medications prescribed during this encounter.'}
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface-subtle)', padding: '16px', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink)' }}>
                    <FileText size={15} color="var(--color-accent-violet)" /> Doctor's Clinical Notes:
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                    {currentVisitData.notes || 'Routine consultation concluded without adverse indications.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="sentry-card" style={{ textAlign: 'center', padding: '40px' }}>
              No visit records found for this patient.
            </div>
          )}

          {/* Add Visit Section */}
          <div className="sentry-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Log a New Clinical Visit</h3>
                <p style={{ fontSize: 13, color: 'var(--color-on-dark-muted)' }}>
                  Appends a new VisitNode to the tail of this patient's Doubly Linked List in O(1) time.
                </p>
              </div>
              <button className="btn-secondary" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus size={14} /> {showAddForm ? 'Cancel' : 'Append Visit Entry'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddVisit} style={{ marginTop: '20px', borderTop: '1px solid var(--color-hairline-violet)', paddingTop: '20px' }}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Visit Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newVisit.visit_date}
                      onChange={(e) => setNewVisit({ ...newVisit, visit_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Doctor Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newVisit.doctor_name}
                      onChange={(e) => setNewVisit({ ...newVisit, doctor_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Clinical Diagnosis</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newVisit.diagnosis}
                      onChange={(e) => setNewVisit({ ...newVisit, diagnosis: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Prescription / Medications</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newVisit.prescription}
                      onChange={(e) => setNewVisit({ ...newVisit, prescription: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vital Signs</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newVisit.vitals}
                      onChange={(e) => setNewVisit({ ...newVisit, vitals: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Notes</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={newVisit.notes}
                    onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Commit Visit Node to Doubly Linked List
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
