import React, { useState } from 'react';
import { api } from '../api';
import { Stethoscope, AlertTriangle, ShieldCheck, GitCommit, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

const SYMPTOM_OPTIONS = [
  { key: 'acute_chest_pain', label: 'Acute Chest Pain / Heavy Pressure', category: 'Cardiac' },
  { key: 'radiating_pain', label: 'Pain Radiating to Left Arm / Shortness of Breath', category: 'Cardiac' },
  { key: 'severe_headache', label: 'Sudden Severe or "Thunderclap" Headache', category: 'Neurological' },
  { key: 'neuro_deficit', label: 'Facial Drooping, Speech Slur, or Stiff Neck', category: 'Neurological' },
  { key: 'cough_wheeze', label: 'Persistent Severe Cough or Wheezing', category: 'Respiratory' },
  { key: 'high_fever_sputum', label: 'High Fever (>102°F) with Rust-colored Sputum', category: 'Respiratory' },
  { key: 'severe_abdominal', label: 'Severe Abdominal Pain or Incoercible Vomiting', category: 'Abdominal' },
  { key: 'rlq_tenderness', label: 'Sharp Right Lower Quadrant Rebound Pain', category: 'Abdominal' },
  { key: 'facial_swelling', label: 'Lip/Tongue Swelling or Acute Stridor (Allergic)', category: 'Immunological' },
  { key: 'joint_eye_pain', label: 'High Fever with Retro-orbital & Joint Pain', category: 'Infectious' },
];

export default function TriagePage({ setActiveTab }) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState(42);
  const [gender, setGender] = useState('Female');
  const [isEmergency, setIsEmergency] = useState(false);
  const [symptoms, setSymptoms] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleSymptom = (key) => {
    setSymptoms(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRunDiagnosis = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter a patient name');
      return;
    }

    try {
      setLoading(true);
      const res = await api.enqueueTriage({
        name: patientName,
        age: parseInt(age, 10),
        gender,
        is_emergency: isEmergency,
        symptoms,
      });
      setResult(res);
    } catch (err) {
      alert(`Diagnosis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            AI Symptom <span className="keyword-chip">Diagnosis</span> & Triage
          </h1>
          <p className="page-subtitle">
            Binary Decision Tree classifier (CO4) mapped into Max-Heap / FIFO Scheduling (CO1)
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Intake & Symptom Selector */}
        <div className="sentry-card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} color="var(--color-accent-lime)" />
              Clinical Symptom Questionnaire
            </span>
            <span className="badge badge-code">Tree Walk O(depth)</span>
          </div>

          <form onSubmit={handleRunDiagnosis}>
            <div className="grid-3" style={{ marginBottom: '16px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Patient Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cassandra Vance"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Protocol Override</label>
                <button
                  type="button"
                  className={`btn-secondary ${isEmergency ? 'active' : ''}`}
                  onClick={() => setIsEmergency(!isEmergency)}
                  style={{
                    borderColor: isEmergency ? 'var(--color-accent-pink)' : 'var(--color-hairline-violet)',
                    color: isEmergency ? 'var(--color-accent-pink)' : 'var(--color-on-dark-muted)',
                    width: '100%',
                    justifyContent: 'center',
                    background: isEmergency ? 'rgba(250, 127, 170, 0.15)' : 'transparent'
                  }}
                >
                  <AlertTriangle size={15} />
                  {isEmergency ? 'FORCE EMERGENCY (HEAP)' : 'ROUTINE INTAKE (FIFO)'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                Select Active Symptoms (Evaluated against Binary Tree nodes):
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SYMPTOM_OPTIONS.map((sym) => {
                  const active = !!symptoms[sym.key];
                  return (
                    <div
                      key={sym.key}
                      onClick={() => toggleSymptom(sym.key)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--rounded-md)',
                        border: `1px solid ${active ? 'var(--color-accent-lime)' : 'var(--color-hairline-violet)'}`,
                        background: active ? 'rgba(194, 239, 78, 0.12)' : 'var(--color-surface-input)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: `2px solid ${active ? 'var(--color-accent-lime)' : 'var(--color-on-dark-muted)'}`,
                            background: active ? 'var(--color-accent-lime)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {active && <CheckCircle2 size={14} color="#150f23" />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                          {sym.label}
                        </span>
                      </div>
                      <span className="badge badge-code" style={{ fontSize: 10 }}>
                        {sym.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              <Sparkles size={16} />
              {loading ? 'Evaluating Decision Tree...' : 'Run AI Diagnosis & Enqueue Patient'}
            </button>
          </form>
        </div>

        {/* Right Column: AI Diagnosis Output & Binary Tree Path */}
        <div>
          {result ? (
            <div className="sentry-card" style={{ borderColor: 'var(--color-accent-lime)' }}>
              <div className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--color-accent-lime)" />
                  AI Decision Tree Diagnosis Result
                </span>
                <span className={`badge ${result.queue_type.includes('priority') ? 'badge-emergency' : 'badge-routine'}`}>
                  {result.queue_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div style={{ background: 'var(--color-surface-subtle)', padding: '16px', borderRadius: 'var(--rounded-lg)', marginBottom: '18px', border: '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Diagnostic Classification (Leaf Node)
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', marginTop: 4 }}>
                  {result.diagnosis.diagnosis}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: 10 }}>
                  <span className="badge badge-emergency">Severity: {result.diagnosis.severity_score}/10</span>
                  <span className="badge badge-code">Queue Pos: #{result.queue_position}</span>
                </div>
              </div>

              {/* Triage & Prescription */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
                  Clinical Action & Triage Recommendation:
                </div>
                <div style={{ padding: '12px', background: 'var(--color-surface-subtle)', borderRadius: 8, fontSize: 13, border: '1px solid var(--color-hairline)' }}>
                  <strong>{result.diagnosis.triage_recommendation}</strong>
                  <div style={{ marginTop: 6, color: 'var(--color-ink-muted)' }}>
                    {result.diagnosis.prescription_advice}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Tree Traversal Path */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GitCommit size={15} color="var(--color-accent-lime)" />
                  Binary Decision Tree Traversal Path (Root-to-Leaf):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.diagnosis.path.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--color-surface-subtle)',
                        borderRadius: 6,
                        borderLeft: `3px solid ${step.answer === 'YES' ? 'var(--color-accent-lime)' : 'var(--color-accent-pink)'}`,
                        fontSize: 13,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>Decision Node #{idx + 1}</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{step.question}</div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: step.answer === 'YES' ? 'var(--color-accent-lime-bg)' : 'var(--color-accent-pink-bg)',
                          color: step.answer === 'YES' ? 'var(--color-accent-lime)' : 'var(--color-accent-pink)',
                          fontWeight: 700
                        }}
                      >
                        {step.answer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => setActiveTab('dashboard')} style={{ flex: 1, justifyContent: 'center' }}>
                  View In Queue
                </button>
                <button className="btn-primary" onClick={() => setActiveTab('patients')} style={{ flex: 1, justifyContent: 'center' }}>
                  View In Records
                </button>
              </div>
            </div>
          ) : (
            <div className="sentry-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(194,239,78,0.1)', color: 'var(--color-accent-lime)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Stethoscope size={30} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Diagnostic Engine Standing By</h3>
              <p style={{ color: 'var(--color-on-dark-muted)', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
                Select the presenting clinical symptoms on the left to walk the Binary Tree decision logic. The system will classify the illness, calculate severity, and assign the patient to either the emergency Max-Heap or routine FIFO Queue.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
