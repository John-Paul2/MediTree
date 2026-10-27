// Central API client for Sentry Health Backend

const API_BASE = '/api';

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const err = new Error(errorBody.error || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.body = errorBody;
    throw err;
  }

  return response.json();
}

export const api = {
  // Patients
  getPatients: (sort = 'id', order = 'asc') => fetchJson(`/patients/?sort=${sort}&order=${order}`),
  getPatientById: (id, method = 'hash') => fetchJson(`/patients/${id}/?method=${method}`),
  createPatient: (data) => fetchJson('/patients/', { method: 'POST', body: JSON.stringify(data) }),

  // Triage & Queues (CO1)
  getTriageStatus: () => fetchJson('/triage/status/'),
  enqueueTriage: (data) => fetchJson('/triage/', { method: 'POST', body: JSON.stringify(data) }),
  dequeueNext: () => fetchJson('/triage/next/', { method: 'POST' }),

  // Visit Logs & Doubly Linked List (CO2)
  getVisits: (patientId) => fetchJson(`/patients/${patientId}/visits/`),
  addVisit: (patientId, data) => fetchJson(`/patients/${patientId}/visits/`, { method: 'POST', body: JSON.stringify(data) }),
  navigateVisits: (patientId, action) => fetchJson(`/patients/${patientId}/visits/navigate/?action=${action}`),

  // AI Diagnostic Tree (CO4)
  diagnose: (symptoms) => fetchJson('/diagnose/', { method: 'POST', body: JSON.stringify({ symptoms }) }),
  getDiagnosticTree: () => fetchJson('/diagnose/'),

  // Disease Contact Graph (CO5)
  getDiseaseGraph: () => fetchJson('/disease/graph/'),
  runBFS: (startId, depth = 2) => fetchJson(`/disease/bfs/?start=${startId}&depth=${depth}`),
  runDFS: (startId) => fetchJson(`/disease/dfs/?start=${startId}`),

  // Benchmark Suite
  getBenchmark: () => fetchJson('/benchmark/'),
};
