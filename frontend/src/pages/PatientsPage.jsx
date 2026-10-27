import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, ArrowUpDown, Plus, User, Calendar, DollarSign, Activity, Eye, Zap, Layers, X } from 'lucide-react';

export default function PatientsPage({ setActiveTab, setSelectedPatientId }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortMeta, setSortMeta] = useState(null);

  // Search state
  const [searchId, setSearchId] = useState('');
  const [searchMethod, setSearchMethod] = useState('binary');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Add Patient Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 32,
    gender: 'Female',
    contact: '+1 (555) 302-9912',
    admission_date: new Date().toISOString().split('T')[0],
    billing_amount: 450.0,
    primary_condition: 'Routine Medical Evaluation',
    severity: 2,
    is_emergency: false,
    department: 'General Medicine',
    blood_group: 'O+'
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await api.getPatients(sortField, sortOrder);
      setPatients(res.results || []);
      setSortMeta({
        algorithm: res.algorithm,
        time_ms: res.time_ms,
        count: res.count
      });
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [sortField, sortOrder]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    try {
      setSearchLoading(true);
      const res = await api.getPatientById(searchId.trim(), searchMethod);
      setSearchResult(res);
    } catch (err) {
      setSearchResult({
        error: `Patient ID #${searchId} not found with ${searchMethod.toUpperCase()}`,
        steps_compared: err.body?.steps || 0,
        time_ms: err.body?.time_ms || 0
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient(newPatient);
      setShowAddModal(false);
      setNewPatient({
        name: '',
        age: 32,
        gender: 'Female',
        contact: '+1 (555) 302-9912',
        admission_date: new Date().toISOString().split('T')[0],
        billing_amount: 450.0,
        primary_condition: 'Routine Medical Evaluation',
        severity: 2,
        is_emergency: false,
        department: 'General Medicine',
        blood_group: 'O+'
      });
      await loadPatients();
    } catch (err) {
      alert(`Failed to add patient: ${err.message}`);
    }
  };

  const handleViewVisits = (id) => {
    if (setSelectedPatientId) setSelectedPatientId(id);
    if (setActiveTab) setActiveTab('visits');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Patient Medical <span className="keyword-chip">Records</span>
          </h1>
          <p className="page-subtitle">
            Merge Sort O(n log n) records organizer & multi-strategy search (Binary, Interpolation, Hash Table, B-Tree)
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Patient Profile
        </button>
      </div>

      {/* Search & Algorithm Benchmark Bar */}
      <div className="sentry-card" style={{ marginBottom: '24px' }}>
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--color-accent-lime)" />
            Algorithmic Patient Lookup Engine (CO3 & CO4)
          </span>
          <span className="badge badge-code">No Built-in Shortcuts</span>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Patient Record ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 15, 27, 42..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ flex: '1 1 240px', marginBottom: 0 }}>
            <label className="form-label">Search Algorithm Strategy</label>
            <select
              className="form-select"
              value={searchMethod}
              onChange={(e) => setSearchMethod(e.target.value)}
            >
              <option value="binary">Binary Search — O(log n)</option>
              <option value="interpolation">Interpolation Search — O(log log n)</option>
              <option value="hash">Hash Table Chaining — O(1)</option>
              <option value="btree">B-Tree Order-3 Index — O(log_t n)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={searchLoading} style={{ height: '42px' }}>
            <Zap size={14} /> {searchLoading ? 'Executing...' : 'Search Record'}
          </button>

          {searchResult && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setSearchResult(null)}
              style={{ height: '42px' }}
            >
              Clear Result
            </button>
          )}
        </form>

        {/* Search Results HUD */}
        {searchResult && (
          <div
            style={{
              marginTop: '18px',
              padding: '16px',
              background: 'var(--color-surface-subtle)',
              borderRadius: 'var(--rounded-lg)',
              border: `1px solid ${searchResult.error ? 'var(--color-accent-pink)' : 'var(--color-hairline)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-code" style={{ color: 'var(--color-accent-lime)' }}>
                  {searchResult.complexity || searchMethod.toUpperCase()}
                </span>
                <span className="badge badge-routine">Comparisons: {searchResult.steps_compared} steps</span>
                <span className="badge badge-code">Latency: {searchResult.time_ms} ms</span>
              </div>
            </div>

            {searchResult.error ? (
              <div style={{ color: 'var(--color-accent-pink)', fontSize: 14 }}>
                {searchResult.error}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {searchResult.patient.name} <span style={{ color: 'var(--color-accent-lime)' }}>(ID: #{searchResult.patient.id})</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-on-dark-muted)', marginTop: 4 }}>
                    Condition: <strong>{searchResult.patient.primary_condition}</strong> | Billing: <strong>${searchResult.patient.billing_amount}</strong> | Dept: {searchResult.patient.department}
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => handleViewVisits(searchResult.patient.id)}>
                  <Eye size={14} /> Open Visit History (DLL)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patients Table Card */}
      <div className="sentry-card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Patient Master Index</span>
            {sortMeta && (
              <span className="badge badge-code">
                {sortMeta.algorithm} in {sortMeta.time_ms} ms ({sortMeta.count} records)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-on-dark-muted)' }}>Merge Sort by:</span>
            <select
              className="form-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 12 }}
            >
              <option value="date">Admission Date</option>
              <option value="billing">Billing Amount</option>
              <option value="severity">Severity Score</option>
              <option value="id">Patient ID</option>
            </select>

            <button
              className="btn-secondary"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <ArrowUpDown size={12} /> {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="sentry-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient Name</th>
                <th>Admission Date</th>
                <th>Billing ($)</th>
                <th>Condition</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-on-dark-muted)' }}>
                    Sorting records with recursive Merge Sort...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-on-dark-muted)' }}>
                    No patient records available.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-code">#{p.id}</span>
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--color-on-dark-muted)' }}>
                        {p.gender}, {p.age} yrs | {p.blood_group}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, fontFamily: 'var(--font-family-mono)' }}>
                      {p.admission_date}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent-lime)' }}>
                      ${p.billing_amount.toFixed(2)}
                    </td>
                    <td style={{ fontSize: 12 }}>{p.primary_condition}</td>
                    <td>
                      <span className={`badge ${p.severity >= 7 ? 'badge-emergency' : 'badge-routine'}`}>
                        {p.severity}/10
                      </span>
                    </td>
                    <td>
                      {p.is_emergency ? (
                        <span className="badge badge-emergency">EMERGENCY</span>
                      ) : (
                        <span className="badge badge-routine">ROUTINE</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-ghost"
                        onClick={() => handleViewVisits(p.id)}
                        style={{ padding: '4px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} /> Visits
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Intake New Patient Profile</h2>
              <button className="btn-ghost" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePatient}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="e.g. Liam Blackwood"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Admission Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPatient.admission_date}
                    onChange={(e) => setNewPatient({ ...newPatient, admission_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newPatient.billing_amount}
                    onChange={(e) => setNewPatient({ ...newPatient, billing_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Clinical Diagnosis / Condition</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPatient.primary_condition}
                  onChange={(e) => setNewPatient({ ...newPatient, primary_condition: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Severity Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={newPatient.severity}
                    onChange={(e) => setNewPatient({ ...newPatient, severity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Admission</label>
                  <select
                    className="form-select"
                    value={newPatient.is_emergency ? 'true' : 'false'}
                    onChange={(e) => setNewPatient({ ...newPatient, is_emergency: e.target.value === 'true' })}
                  >
                    <option value="false">Routine Appointment</option>
                    <option value="true">Emergency Patient</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
