"""
Module: graph.py
Course Outcome: CO5 (Disease Progression Modeling)

Implements an Adjacency-List Graph Data Structure from scratch:
- Represents epidemiological transmission contacts between patient nodes.
- Breadth-First Search (BFS) with depth layers to model contagion transmission radius.
- Depth-First Search (DFS) to trace back the infection lineage and identify Patient Zero.
- Integrates custom Queue (FIFO) and Stack (LIFO) from queue_structures.py.
"""

from typing import Any, Dict, List, Optional, Set, Tuple
from .queue_structures import Queue, Stack


class ContactGraph:
    """Epidemiological Contact Network Graph implemented via Adjacency Lists."""
    def __init__(self):
        # adjacency_list: { patient_id: [neighbor_id_1, neighbor_id_2, ...] }
        self._adj: Dict[str, List[str]] = {}
        # metadata: { patient_id: { "name": ..., "infection_status": ..., "location": ..., ... } }
        self._nodes: Dict[str, Dict[str, Any]] = {}
        # edges_metadata: { (u, v): { "contact_type": ..., "risk_score": ... } }
        self._edge_info: Dict[str, Dict[str, Any]] = {}

    def add_patient_node(self, patient_id: Any, metadata: Dict[str, Any]) -> None:
        """Adds a patient vertex to the graph."""
        p_id = str(patient_id)
        if p_id not in self._adj:
            self._adj[p_id] = []
        self._nodes[p_id] = {**metadata, "id": p_id}

    def add_contact_edge(self, p1: Any, p2: Any, contact_type: str = "Household", risk: float = 0.8) -> None:
        """Adds an undirected contact link between two patients."""
        u = str(p1)
        v = str(p2)
        if u not in self._adj:
            self._adj[u] = []
        if v not in self._adj:
            self._adj[v] = []

        if v not in self._adj[u]:
            self._adj[u].append(v)
        if u not in self._adj[v]:
            self._adj[v].append(u)

        key1 = f"{u}->{v}"
        key2 = f"{v}->{u}"
        edge_data = {"contact_type": contact_type, "risk": risk}
        self._edge_info[key1] = edge_data
        self._edge_info[key2] = edge_data

    def bfs_transmission_radius(self, start_id: Any, max_depth: int = 2) -> Dict[str, Any]:
        """Models contagion spread outward from a patient within max_depth waves.
        Uses our scratch FIFO Queue.
        
        Returns:
            Dict containing:
                - visited_order: List of patient IDs
                - depth_layers: { "0": [start], "1": [...], "2": [...] }
                - total_exposed: int
                - edges_traversed: List of [u, v]
        """
        start = str(start_id)
        if start not in self._adj:
            return {"error": f"Patient {start_id} not found in contact network", "nodes": [], "layers": {}}

        visited: Set[str] = {start}
        queue = Queue()
        # Enqueue tuple (patient_id, current_depth)
        queue.enqueue((start, 0))

        depth_layers: Dict[int, List[str]] = {}
        visited_order: List[str] = []
        edges_traversed: List[Tuple[str, str]] = []

        while not queue.is_empty():
            curr_id, depth = queue.dequeue()
            visited_order.append(curr_id)

            if depth not in depth_layers:
                depth_layers[depth] = []
            depth_layers[depth].append(curr_id)

            if depth < max_depth:
                for neighbor in self._adj.get(curr_id, []):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        edges_traversed.append((curr_id, neighbor))
                        queue.enqueue((neighbor, depth + 1))

        return {
            "start_id": start,
            "max_depth": max_depth,
            "total_exposed": len(visited_order),
            "visited_order": visited_order,
            "depth_layers": depth_layers,
            "edges_traversed": edges_traversed,
            "nodes_data": [self._nodes.get(nid, {"id": nid, "name": f"Patient {nid}"}) for nid in visited_order]
        }

    def dfs_trace_origin(self, start_id: Any) -> Dict[str, Any]:
        """Traces infection lineage and suspected origin (Patient Zero) using our scratch LIFO Stack.
        
        Returns:
            Dict containing:
                - traversal_path: List of patient IDs visited in DFS branch order
                - suspected_origin: Patient node with earliest transmission or highest degree
                - lineage_edges: List of edges visited
        """
        start = str(start_id)
        if start not in self._adj:
            return {"error": f"Patient {start_id} not found in contact network", "path": []}

        visited: Set[str] = set()
        stack = Stack()
        stack.push(start)

        traversal_path: List[str] = []
        lineage_edges: List[Tuple[str, str]] = []
        parent_map: Dict[str, Optional[str]] = {start: None}

        while not stack.is_empty():
            curr_id = stack.pop()
            if curr_id not in visited:
                visited.add(curr_id)
                traversal_path.append(curr_id)

                # Push neighbors onto stack (reverse order for deterministic traversal)
                neighbors = self._adj.get(curr_id, [])
                for neighbor in reversed(neighbors):
                    if neighbor not in visited:
                        parent_map[neighbor] = curr_id
                        lineage_edges.append((curr_id, neighbor))
                        stack.push(neighbor)

        # Suspected origin evaluation: Node with earliest diagnosis date or highest connectivity
        suspected_origin_id = start
        earliest_date = "9999-99-99"
        for nid in visited:
            node_info = self._nodes.get(nid, {})
            diag_date = str(node_info.get("admission_date", "9999-99-99"))
            if diag_date < earliest_date:
                earliest_date = diag_date
                suspected_origin_id = nid

        return {
            "start_id": start,
            "suspected_origin_id": suspected_origin_id,
            "suspected_origin_info": self._nodes.get(suspected_origin_id, {"id": suspected_origin_id}),
            "traversal_path": traversal_path,
            "lineage_edges": lineage_edges,
            "total_cluster_size": len(visited),
            "nodes_data": [self._nodes.get(nid, {"id": nid, "name": f"Patient {nid}"}) for nid in traversal_path]
        }

    def get_full_graph(self) -> Dict[str, Any]:
        """Returns entire graph topology formatted for front-end network visualizer."""
        nodes = []
        for nid, data in self._nodes.items():
            nodes.append({
                "id": nid,
                "label": data.get("name", f"Patient {nid}"),
                "severity": data.get("severity", 1),
                "is_infected": data.get("is_infected", True),
                "admission_date": data.get("admission_date", ""),
                "department": data.get("department", "General"),
            })

        links = []
        seen_edges = set()
        for u, neighbors in self._adj.items():
            for v in neighbors:
                edge_pair = tuple(sorted([u, v]))
                if edge_pair not in seen_edges:
                    seen_edges.add(edge_pair)
                    edge_key = f"{u}->{v}"
                    info = self._edge_info.get(edge_key, {})
                    links.append({
                        "source": u,
                        "target": v,
                        "contact_type": info.get("contact_type", "Contact"),
                        "risk": info.get("risk", 0.5)
                    })

        return {"nodes": nodes, "links": links}
