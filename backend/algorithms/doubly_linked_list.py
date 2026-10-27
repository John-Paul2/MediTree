"""
Module: doubly_linked_list.py
Course Outcome: CO2 (Patient Visit Logging)

Implements a Doubly Linked List from scratch to store sequential logs of a patient's
historical visits. Demonstrates dynamic pointer manipulation and allows bidirectional
cursor navigation (prev/next) for medical practitioners.
"""

from typing import Any, List, Optional, Dict


class VisitNode:
    """Represents a single clinical visit node in a doubly linked list."""
    def __init__(self, data: Dict[str, Any]):
        self.data: Dict[str, Any] = data
        self.prev: Optional['VisitNode'] = None
        self.next: Optional['VisitNode'] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "data": self.data,
            "has_prev": self.prev is not None,
            "has_next": self.next is not None,
            "prev_id": self.prev.data.get("id") if self.prev else None,
            "next_id": self.next.data.get("id") if self.next else None,
        }


class DoublyLinkedList:
    """Doubly Linked List for sequential clinical logs with cursor-based navigation."""
    def __init__(self):
        self.head: Optional[VisitNode] = None
        self.tail: Optional[VisitNode] = None
        self._cursor: Optional[VisitNode] = None
        self._size: int = 0

    def append(self, data: Dict[str, Any]) -> VisitNode:
        """Add a visit to the end of the history. O(1) time."""
        new_node = VisitNode(data)
        if self.head is None:
            self.head = new_node
            self.tail = new_node
            self._cursor = new_node
        else:
            assert self.tail is not None
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node
        self._size += 1
        return new_node

    def prepend(self, data: Dict[str, Any]) -> VisitNode:
        """Add a visit to the beginning. O(1) time."""
        new_node = VisitNode(data)
        if self.head is None:
            self.head = new_node
            self.tail = new_node
            self._cursor = new_node
        else:
            new_node.next = self.head
            self.head.prev = new_node
            self.head = new_node
        self._size += 1
        return new_node

    def current(self) -> Optional[Dict[str, Any]]:
        """Returns the visit at the current cursor."""
        if self._cursor is None:
            if self.tail is not None:
                self._cursor = self.tail
            elif self.head is not None:
                self._cursor = self.head
            else:
                return None
        return self._cursor.to_dict()

    def move_next(self) -> Optional[Dict[str, Any]]:
        """Move cursor to the next visit node (chronologically forward)."""
        if self._cursor is not None and self._cursor.next is not None:
            self._cursor = self._cursor.next
            return self._cursor.to_dict()
        elif self._cursor is None and self.head is not None:
            self._cursor = self.head
            return self._cursor.to_dict()
        return None  # Reached end or empty

    def move_prev(self) -> Optional[Dict[str, Any]]:
        """Move cursor to the previous visit node (chronologically backward)."""
        if self._cursor is not None and self._cursor.prev is not None:
            self._cursor = self._cursor.prev
            return self._cursor.to_dict()
        elif self._cursor is None and self.tail is not None:
            self._cursor = self.tail
            return self._cursor.to_dict()
        return None  # Reached beginning or empty

    def reset_to_head(self) -> Optional[Dict[str, Any]]:
        self._cursor = self.head
        return self._cursor.to_dict() if self._cursor else None

    def reset_to_tail(self) -> Optional[Dict[str, Any]]:
        self._cursor = self.tail
        return self._cursor.to_dict() if self._cursor else None

    def set_cursor_by_id(self, visit_id: Any) -> Optional[Dict[str, Any]]:
        curr = self.head
        while curr:
            if str(curr.data.get("id")) == str(visit_id):
                self._cursor = curr
                return curr.to_dict()
            curr = curr.next
        return None

    def to_list(self) -> List[Dict[str, Any]]:
        """Convert doubly linked list to linear list of dicts."""
        res = []
        curr = self.head
        while curr:
            res.append(curr.to_dict())
            curr = curr.next
        return res

    def __len__(self) -> int:
        return self._size
