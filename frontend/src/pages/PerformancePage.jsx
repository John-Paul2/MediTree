import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart3, TrendingUp, Cpu, Award, Zap, RefreshCw, CheckCircle } from 'lucide-react';

export default function PerformancePage() {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBenchmark = async () => {
    try {
      setLoading(true);
      const data = await api.getBenchmark();
      setBenchmarkData(data);
    } catch (err) {
      alert(`Benchmark execution error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  const sortingRows = benchmarkData?.sorting_benchmark || [];
  const searchRows = benchmarkData?.searching_benchmark || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Empirical Algorithm <span className="keyword-chip">Benchmarks</span>
          </h1>
          <p className="page-subtitle">
            Time-complexity validation & performance benchmarking suite across CO1, CO2, CO3, CO4, CO5
          </p>
        </div>
        <button className="btn-primary" onClick={runBenchmark} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Executing Test Cycles...' : 'Run Live Benchmark Test'}
        </button>
      </div>

      {/* Sorting Benchmark Card */}
      <div className="sentry-card" style={{ marginBottom: '24px' }}>
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--color-accent-lime)" />
            CO3: Merge Sort vs Built-in Timsort (Execution Latency)
          </span>
          <span className="badge badge-code">Empirical O(n log n)</span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--color-on-dark-muted)', marginBottom: 16 }}>
          Evaluates pure divide-and-conquer Merge Sort implemented from scratch without built-in <code>sorted()</code> or <code>.sort()</code> against Python's highly optimized C-implemented Timsort across growing dataset sizes.
        </p>

        <div className="table-container">
          <table className="sentry-table">
            <thead>
              <tr>
                <th>Input Size (N)</th>
                <th>Scratch Merge Sort</th>
                <th>Python Built-in (Timsort)</th>
                <th>Ratio (Scratch / Builtin)</th>
                <th>Relative Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {sortingRows.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-on-dark-muted)' }}>
                    Loading benchmark metrics...
                  </td>
                </tr>
              ) : (
                sortingRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge badge-code" style={{ fontSize: 13 }}>N = {row.n.toLocaleString()}</span>
                    </td>
                    <td style={{ color: 'var(--color-accent-lime)', fontWeight: 600 }}>
                      {row.merge_sort_ms} ms
                    </td>
                    <td style={{ color: 'var(--color-on-dark-muted)' }}>
                      {row.builtin_sort_ms} ms
                    </td>
                    <td>
                      <span className="badge badge-code">{row.speedup_ratio}x</span>
                    </td>
                    <td>
                      {/* Visual bar */}
                      <div style={{ width: '100%', maxWidth: '180px', height: '8px', background: 'var(--color-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(10, (row.merge_sort_ms / 30) * 100))}%`,
                            background: '#5438dc',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Searching Benchmark Card */}
      <div className="sentry-card" style={{ marginBottom: '24px' }}>
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--color-accent-lime)" />
            CO3: Searching Algorithms Comparison (Comparison Steps & Latency)
          </span>
          <span className="badge badge-code">Linear vs Binary vs Interpolation vs Hash</span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--color-on-dark-muted)', marginBottom: 16 }}>
          Empirical comparison of step counts and execution latencies across Linear Search <code className="badge-code">O(n)</code>, Binary Search <code className="badge-code">O(log n)</code>, Interpolation Search <code className="badge-code">O(log log n)</code>, and Separate-Chaining Hash Table <code className="badge-code">O(1)</code>.
        </p>

        <div className="table-container">
          <table className="sentry-table">
            <thead>
              <tr>
                <th>Input Size (N)</th>
                <th>Linear Search O(n)</th>
                <th>Binary Search O(log n)</th>
                <th>Interpolation Search O(log log n)</th>
                <th>Hash Table O(1)</th>
              </tr>
            </thead>
            <tbody>
              {searchRows.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-on-dark-muted)' }}>
                    Loading search metrics...
                  </td>
                </tr>
              ) : (
                searchRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge badge-code">N = {row.n.toLocaleString()}</span>
                    </td>
                    <td>
                      <div><strong>{row.linear.steps} steps</strong></div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-dark-muted)' }}>{row.linear.time_us} μs</div>
                    </td>
                    <td style={{ color: 'var(--color-accent-lime)' }}>
                      <div><strong>{row.binary.steps} steps</strong></div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-dark-muted)' }}>{row.binary.time_us} μs</div>
                    </td>
                    <td style={{ color: '#fa7faa' }}>
                      <div><strong>{row.interpolation.steps} steps</strong></div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-dark-muted)' }}>{row.interpolation.time_us} μs</div>
                    </td>
                    <td style={{ color: 'var(--color-accent-lime)', fontWeight: 700 }}>
                      <div><strong>{row.hash_table.steps} steps</strong></div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-dark-muted)' }}>{row.hash_table.time_us} μs</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CO1 to CO5 Theoretical vs Implementation Mapping Table */}
      <div className="sentry-card">
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--color-accent-lime)" />
            Course Outcomes (CO1 - CO5) Architecture Mapping
          </span>
          <span className="badge badge-routine">Full Rubric Alignment</span>
        </div>

        <div className="table-container">
          <table className="sentry-table">
            <thead>
              <tr>
                <th>Outcome</th>
                <th>Data Structure & Algorithm</th>
                <th>Theoretical Complexity</th>
                <th>Application in Sentry Health</th>
                <th>Implementation File</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>CO1</strong></td>
                <td>FIFO Queue & Max-Heap Priority Queue</td>
                <td><code className="badge-code">Queue: O(1) | Heap: O(log n)</code></td>
                <td>Routine clinic scheduling vs Emergency triage dequeue based on severity</td>
                <td><code>backend/algorithms/queue_structures.py</code></td>
              </tr>
              <tr>
                <td><strong>CO2</strong></td>
                <td>Doubly Linked List (Bidirectional)</td>
                <td><code className="badge-code">Nav: O(1) | Append: O(1)</code></td>
                <td>Patient clinical visit history with prev/next cursor navigation</td>
                <td><code>backend/algorithms/doubly_linked_list.py</code></td>
              </tr>
              <tr>
                <td><strong>CO3</strong></td>
                <td>Merge Sort, Binary Search, Interpolation Search</td>
                <td><code className="badge-code">Sort: O(n log n) | Bin: O(log n) | Interp: O(log log n)</code></td>
                <td>Organizing records by admission date or billing, fast ID retrieval</td>
                <td><code>backend/algorithms/sorting_searching.py</code></td>
              </tr>
              <tr>
                <td><strong>CO4</strong></td>
                <td>Binary Decision Tree & B-Tree</td>
                <td><code className="badge-code">Tree: O(h) | B-Tree: O(log_t n)</code></td>
                <td>Automated AI symptom diagnosis & hierarchical patient profile database</td>
                <td><code>backend/algorithms/binary_tree.py & b_tree.py</code></td>
              </tr>
              <tr>
                <td><strong>CO5</strong></td>
                <td>Graph (Adjacency List) with BFS & DFS</td>
                <td><code className="badge-code">Traversals: O(V + E)</code></td>
                <td>Epidemiological contact network, transmission waves (BFS), Patient Zero origin (DFS)</td>
                <td><code>backend/algorithms/graph.py</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
