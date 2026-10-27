import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Share2, Radio, Compass, Users, AlertCircle, ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';

export default function DiseaseTrackerPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNodeId, setSelectedNodeId] = useState('1');
  const [bfsDepth, setBfsDepth] = useState(2);
  const [bfsResult, setBfsResult] = useState(null);
  const [dfsResult, setDfsResult] = useState(null);
  const [mode, setMode] = useState('all'); // 'all', 'bfs', 'dfs'
  const [loading, setLoading] = useState(true);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const data = await api.getDiseaseGraph();
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load contact graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const handleRunBFS = async () => {
    try {
      setLoading(true);
      const res = await api.runBFS(selectedNodeId, bfsDepth);
      setBfsResult(res);
      setDfsResult(null);
      setMode('bfs');
    } catch (err) {
      alert(`BFS error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDFS = async () => {
    try {
      setLoading(true);
      const res = await api.runDFS(selectedNodeId);
      setDfsResult(res);
      setBfsResult(null);
      setMode('dfs');
    } catch (err) {
      alert(`DFS error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Compute 2D node coordinates in a circular/clustered layout
  const nodePositions = useMemo(() => {
    const nodes = graphData.nodes || [];
    const count = nodes.length;
    const width = 760;
    const height = 520;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.42;

    const positions = {};
    nodes.forEach((n, idx) => {
      const angle = (idx / count) * 2 * Math.PI;
      // Add slight jitter for natural graph cluster feel
      const r = radius * (0.85 + (idx % 3) * 0.1);
      positions[n.id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        ...n
      };
    });
    return positions;
  }, [graphData]);

  // Determine node styling based on BFS or DFS active highlight
  const getNodeColor = (nid) => {
    if (mode === 'bfs' && bfsResult) {
      const layers = bfsResult.depth_layers || {};
      if (String(nid) === String(bfsResult.start_id)) return '#d81b60'; // Seed (Pink)
      if (layers['1'] && layers['1'].includes(String(nid))) return '#1f7a00'; // Wave 1 (Green)
      if (layers['2'] && layers['2'].includes(String(nid))) return '#5438dc'; // Wave 2 (Violet)
      if (layers['3'] && layers['3'].includes(String(nid))) return '#8e7cc3'; // Wave 3
      return '#e7e4f3';
    }

    if (mode === 'dfs' && dfsResult) {
      if (String(nid) === String(dfsResult.suspected_origin_id)) return '#d81b60'; // Patient zero
      if (dfsResult.traversal_path && dfsResult.traversal_path.includes(String(nid))) return '#5438dc';
      return '#e7e4f3';
    }

    // Default: color by infection status
    const node = nodePositions[nid];
    return node?.is_infected ? '#d81b60' : '#5438dc';
  };

  const isEdgeHighlighted = (u, v) => {
    if (mode === 'bfs' && bfsResult?.edges_traversed) {
      return bfsResult.edges_traversed.some(
        ([a, b]) => (a === u && b === v) || (a === v && b === u)
      );
    }
    if (mode === 'dfs' && dfsResult?.lineage_edges) {
      return dfsResult.lineage_edges.some(
        ([a, b]) => (a === u && b === v) || (a === v && b === u)
      );
    }
    return false;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Epidemiological <span className="keyword-chip">Contact Graph</span>
          </h1>
          <p className="page-subtitle">
            Graph Data Structure (CO5: Adjacency List, BFS transmission radius waves, DFS origin tracing)
          </p>
        </div>
        <button className="btn-secondary" onClick={loadGraph} disabled={loading}>
          <RefreshCw size={14} /> Refresh Graph
        </button>
      </div>

      {/* Control Console */}
      <div className="sentry-card" style={{ marginBottom: '20px' }}>
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="var(--color-accent-lime)" />
            Epidemiological Graph Traversal Engine
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-code">Adjacency List</span>
            <span className="badge badge-code">Vertices: {graphData.nodes.length}</span>
            <span className="badge badge-code">Edges: {graphData.links.length}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label className="form-label">Starting Patient Node</label>
            <select
              className="form-select"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
            >
              {graphData.nodes.map(n => (
                <option key={n.id} value={n.id}>
                  #{n.id} - {n.label} ({n.department})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: '0 1 140px' }}>
            <label className="form-label">BFS Wave Depth</label>
            <select
              className="form-select"
              value={bfsDepth}
              onChange={(e) => setBfsDepth(parseInt(e.target.value))}
            >
              <option value="1">1 Layer (Direct)</option>
              <option value="2">2 Layers (Secondary)</option>
              <option value="3">3 Layers (Tertiary)</option>
              <option value="4">4 Layers (Outbreak)</option>
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={handleRunBFS}
            disabled={loading}
            style={{ height: '42px' }}
          >
            <Radio size={14} /> Run BFS (Transmission Radius)
          </button>

          <button
            className="btn-danger"
            onClick={handleRunDFS}
            disabled={loading}
            style={{ height: '42px' }}
          >
            <ShieldAlert size={14} /> Run DFS (Trace Patient Zero)
          </button>

          <button
            className="btn-secondary"
            onClick={() => { setMode('all'); setBfsResult(null); setDfsResult(null); }}
            style={{ height: '42px' }}
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Traversal Results Summary HUD */}
      {bfsResult && (
        <div className="sentry-card" style={{ marginBottom: '20px', borderColor: 'var(--color-accent-lime)', background: 'linear-gradient(90deg, rgba(194,239,78,0.1) 0%, var(--color-surface-card) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--color-accent-lime)', fontWeight: 700 }}>
                Breadth-First Search (Queue FIFO) Transmission Radius
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                Contagion Wave reached {bfsResult.total_exposed} patients within {bfsResult.max_depth} degrees of contact.
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-on-dark-muted)', marginTop: 4 }}>
                Layer 0 (Origin): #{bfsResult.start_id} | Layer 1 (Direct): {bfsResult.depth_layers['1']?.join(', ') || 'None'} | Layer 2: {bfsResult.depth_layers['2']?.join(', ') || 'None'}
              </div>
            </div>
            <span className="badge badge-emergency" style={{ fontSize: 14, padding: '6px 14px' }}>
              Exposed Pool: {bfsResult.total_exposed}
            </span>
          </div>
        </div>
      )}

      {dfsResult && (
        <div className="sentry-card" style={{ marginBottom: '20px', borderColor: 'var(--color-accent-pink)', background: 'linear-gradient(90deg, rgba(250,127,170,0.12) 0%, var(--color-surface-card) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--color-accent-pink)', fontWeight: 700 }}>
                Depth-First Search (Stack LIFO) Infection Origin Lineage
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                Suspected Patient Zero: Patient #{dfsResult.suspected_origin_id} ({dfsResult.suspected_origin_info?.name || 'Index Case'})
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-on-dark-muted)', marginTop: 4 }}>
                Cluster Depth: {dfsResult.total_cluster_size} connected cases | DFS Path: {dfsResult.traversal_path?.slice(0, 10).join(' → ')}...
              </div>
            </div>
            <span className="badge badge-emergency" style={{ fontSize: 13, padding: '6px 14px' }}>
              Patient Zero Identified
            </span>
          </div>
        </div>
      )}

      {/* SVG Network Graph Visualization */}
      <div className="sentry-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Legend:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d81b60' }} />
              Seed / Patient Zero
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1f7a00' }} />
              Active Transmission Wave / Visited
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#5438dc' }} />
              Standard Patient Node
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
            Interactive Topology (Click node to inspect)
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px', overflowX: 'auto', background: 'var(--color-surface-subtle)' }}>
          <svg width="760" height="520" style={{ background: 'var(--color-svg-bg)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)' }}>
            {/* Edges */}
            {graphData.links.map((link, idx) => {
              const src = nodePositions[link.source];
              const tgt = nodePositions[link.target];
              if (!src || !tgt) return null;

              const highlighted = isEdgeHighlighted(String(link.source), String(link.target));

              return (
                <line
                  key={idx}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={highlighted ? '#150f23' : 'var(--color-svg-edge)'}
                  strokeWidth={highlighted ? 3.5 : 1.4}
                  strokeOpacity={highlighted ? 1 : 0.6}
                />
              );
            })}

            {/* Nodes */}
            {graphData.nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isSelected = String(node.id) === String(selectedNodeId);
              const nodeColor = getNodeColor(node.id);
              const isInactive = nodeColor === '#e7e4f3';

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(String(node.id))}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 16 : 11}
                    fill={nodeColor}
                    stroke={isSelected ? '#150f23' : '#ffffff'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    opacity={0.95}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill={isInactive ? '#574e6d' : '#ffffff'}
                    fontFamily="var(--font-family-mono)"
                  >
                    {node.id}
                  </text>
                  {/* Label for selected */}
                  {isSelected && (
                    <text
                      x={pos.x}
                      y={pos.y - 20}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="var(--color-ink)"
                      fontFamily="var(--font-family-sans)"
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
