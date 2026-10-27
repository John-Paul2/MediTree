"""
Module: b_tree.py
Course Outcome: CO4 (Patient Profile Database Management)

Implements a balanced B-Tree (order t) from scratch for hierarchical, block-efficient
storage and retrieval of patient profile records.
- Insertion with proactive node splitting (O(t * log_t n))
- Exact search with step-by-step path tracing (O(log_t n))
- In-order traversal yielding records in strictly sorted key order (O(n))
"""

from typing import Any, List, Optional, Tuple, Dict


class BTreeNode:
    """Represents a node in an order-t B-Tree."""
    def __init__(self, leaf: bool = True):
        self.leaf: bool = leaf
        # Keys stored in strictly ascending order
        self.keys: List[int] = []
        # Corresponding values/patient records stored with each key
        self.values: List[Any] = []
        # Child pointers (references to other BTreeNodes)
        self.children: List['BTreeNode'] = []

    def to_dict(self) -> Dict[str, Any]:
        """Hierarchical dictionary serialization for UI representation."""
        return {
            "keys": self.keys,
            "is_leaf": self.leaf,
            "children": [child.to_dict() for child in self.children] if not self.leaf else []
        }


class BTree:
    """B-Tree indexing engine for patient profiles."""
    def __init__(self, t: int = 3):
        """
        Args:
            t: Minimum degree. Every node (except root) must contain at least t-1 keys.
               A node can contain at most 2t - 1 keys and 2t children.
        """
        if t < 2:
            raise ValueError("B-Tree minimum degree t must be >= 2")
        self.t: int = t
        self.root: BTreeNode = BTreeNode(leaf=True)
        self._size: int = 0

    def search(self, key: int, node: Optional[BTreeNode] = None) -> Tuple[Optional[Any], int, List[str]]:
        """Searches for a key starting from the specified node (or root).
        
        Returns:
            (value, comparison_steps, path_trace)
        """
        if node is None:
            node = self.root

        steps = 0
        path_trace: List[str] = []
        curr = node

        while curr is not None:
            path_trace.append(f"Node({curr.keys})")
            i = 0
            while i < len(curr.keys):
                steps += 1
                if key == curr.keys[i]:
                    return curr.values[i], steps, path_trace
                elif key < curr.keys[i]:
                    break
                i += 1

            if curr.leaf:
                return None, steps, path_trace

            curr = curr.children[i]

        return None, steps, path_trace

    def insert(self, key: int, value: Any) -> None:
        """Inserts a key-value pair into the B-Tree."""
        root = self.root
        # If root is full (contains 2t - 1 keys), tree grows in height
        if len(root.keys) == (2 * self.t - 1):
            new_root = BTreeNode(leaf=False)
            new_root.children.append(root)
            self._split_child(new_root, 0, root)
            self.root = new_root
            self._insert_non_full(new_root, key, value)
        else:
            self._insert_non_full(root, key, value)
        self._size += 1

    def _split_child(self, parent: BTreeNode, index: int, child: BTreeNode) -> None:
        """Splits the full child of parent at index."""
        t = self.t
        new_sibling = BTreeNode(leaf=child.leaf)

        # Sibling gets t - 1 keys from child
        median_key = child.keys[t - 1]
        median_val = child.values[t - 1]

        new_sibling.keys = child.keys[t:(2 * t - 1)]
        new_sibling.values = child.values[t:(2 * t - 1)]

        if not child.leaf:
            new_sibling.children = child.children[t:(2 * t)]
            child.children = child.children[0:t]

        # Truncate child to first t - 1 keys
        child.keys = child.keys[0:(t - 1)]
        child.values = child.values[0:(t - 1)]

        # Insert new sibling into parent's children
        parent.children.insert(index + 1, new_sibling)

        # Elevate median key up into parent
        parent.keys.insert(index, median_key)
        parent.values.insert(index, median_val)

    def _insert_non_full(self, node: BTreeNode, key: int, value: Any) -> None:
        """Helper to insert into a node that is guaranteed not full."""
        i = len(node.keys) - 1

        if node.leaf:
            # Insert in sorted position
            node.keys.append(key)
            node.values.append(value)
            while i >= 0 and node.keys[i] > key:
                node.keys[i + 1] = node.keys[i]
                node.values[i + 1] = node.values[i]
                i -= 1
            node.keys[i + 1] = key
            node.values[i + 1] = value
        else:
            # Find the child which is going to have the new key
            while i >= 0 and node.keys[i] > key:
                i -= 1
            i += 1

            # See if the found child is full
            if len(node.children[i].keys) == (2 * self.t - 1):
                self._split_child(node, i, node.children[i])
                if key > node.keys[i]:
                    i += 1
            self._insert_non_full(node.children[i], key, value)

    def in_order_traversal(self, node: Optional[BTreeNode] = None) -> List[Tuple[int, Any]]:
        """Performs in-order traversal, returning items sorted by key."""
        if node is None:
            node = self.root

        res = []
        self._traverse(node, res)
        return res

    def _traverse(self, node: BTreeNode, result: List[Tuple[int, Any]]) -> None:
        for i in range(len(node.keys)):
            if not node.leaf and i < len(node.children):
                self._traverse(node.children[i], result)
            result.append((node.keys[i], node.values[i]))

        if not node.leaf and len(node.children) > len(node.keys):
            self._traverse(node.children[len(node.keys)], result)

    def __len__(self) -> int:
        return self._size

    def to_dict(self) -> Dict[str, Any]:
        return self.root.to_dict()
