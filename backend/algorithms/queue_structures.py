"""
Module: queue_structures.py
Course Outcome: CO1 (Emergency Triage & Scheduling)

Implements from scratch without using any built-in queue or heapq modules:
1. Stack (LIFO) - Array & node-capable, used in DFS and undo/rollback operations.
2. Queue (FIFO) - Used for routine patient appointments.
3. PriorityQueue (Max-Heap) - Used for emergency triage where highest severity patients
   are dequeued first.
"""

from typing import Any, List, Optional, Tuple


class StackNode:
    def __init__(self, value: Any):
        self.value = value
        self.next: Optional['StackNode'] = None


class Stack:
    """LIFO Stack data structure implemented from scratch using linked nodes."""
    def __init__(self):
        self._top: Optional[StackNode] = None
        self._size: int = 0

    def push(self, item: Any) -> None:
        """Push an item onto the top of the stack. O(1) time."""
        node = StackNode(item)
        node.next = self._top
        self._top = node
        self._size += 1

    def pop(self) -> Any:
        """Pop and return the top item. O(1) time. Raises IndexError if empty."""
        if self.is_empty():
            raise IndexError("pop from empty stack")
        item = self._top.value
        self._top = self._top.next
        self._size -= 1
        return item

    def peek(self) -> Optional[Any]:
        """Return the top item without removing it. O(1) time."""
        if self.is_empty():
            return None
        return self._top.value

    def is_empty(self) -> bool:
        return self._size == 0

    def __len__(self) -> int:
        return self._size

    def to_list(self) -> List[Any]:
        """Returns items from top to bottom."""
        res = []
        curr = self._top
        while curr:
            res.append(curr.value)
            curr = curr.next
        return res


class QueueNode:
    def __init__(self, value: Any):
        self.value = value
        self.next: Optional['QueueNode'] = None


class Queue:
    """FIFO Queue data structure implemented from scratch using linked nodes.
    Satisfies CO1 for Routine Patient Appointment Scheduling.
    """
    def __init__(self):
        self._head: Optional[QueueNode] = None
        self._tail: Optional[QueueNode] = None
        self._size: int = 0

    def enqueue(self, item: Any) -> None:
        """Add item to back of the queue. O(1) time."""
        node = QueueNode(item)
        if self.is_empty():
            self._head = node
            self._tail = node
        else:
            assert self._tail is not None
            self._tail.next = node
            self._tail = node
        self._size += 1

    def dequeue(self) -> Any:
        """Remove and return front item. O(1) time. Raises IndexError if empty."""
        if self.is_empty():
            raise IndexError("dequeue from empty queue")
        assert self._head is not None
        item = self._head.value
        self._head = self._head.next
        if self._head is None:
            self._tail = None
        self._size -= 1
        return item

    def peek(self) -> Optional[Any]:
        """View front item without removing it. O(1) time."""
        if self.is_empty():
            return None
        assert self._head is not None
        return self._head.value

    def is_empty(self) -> bool:
        return self._size == 0

    def __len__(self) -> int:
        return self._size

    def to_list(self) -> List[Any]:
        """Returns items in FIFO order (from front to back)."""
        res = []
        curr = self._head
        while curr:
            res.append(curr.value)
            curr = curr.next
        return res


class PriorityQueue:
    """Max-Heap Priority Queue implemented from scratch without heapq.
    Satisfies CO1 for Emergency Triage Scheduling.
    
    Higher severity score = higher priority (dequeued first).
    When severities are identical, tie-breaker prioritizes earlier entry (FIFO).
    Stored entries are tuples: (-severity, entry_count, patient_data).
    """
    def __init__(self):
        # Array-based binary heap
        self._heap: List[Tuple[int, int, Any]] = []
        self._entry_counter: int = 0

    def _parent(self, i: int) -> int:
        return (i - 1) // 2

    def _left(self, i: int) -> int:
        return 2 * i + 1

    def _right(self, i: int) -> int:
        return 2 * i + 2

    def _greater_priority(self, a: Tuple[int, int, Any], b: Tuple[int, int, Any]) -> bool:
        """Returns True if a has higher priority than b.
        a[0] is severity (higher is better).
        If severities tie, lower entry_counter is better (FIFO).
        """
        sev_a, count_a, _ = a
        sev_b, count_b, _ = b
        if sev_a > sev_b:
            return True
        elif sev_a == sev_b:
            return count_a < count_b
        return False

    def _sift_up(self, index: int) -> None:
        """Bubble up the node at index until max-heap property is satisfied."""
        while index > 0:
            p = self._parent(index)
            if self._greater_priority(self._heap[index], self._heap[p]):
                self._heap[index], self._heap[p] = self._heap[p], self._heap[index]
                index = p
            else:
                break

    def _sift_down(self, index: int) -> None:
        """Bubble down the node at index until max-heap property is satisfied."""
        size = len(self._heap)
        while True:
            largest = index
            l = self._left(index)
            r = self._right(index)

            if l < size and self._greater_priority(self._heap[l], self._heap[largest]):
                largest = l
            if r < size and self._greater_priority(self._heap[r], self._heap[largest]):
                largest = r

            if largest != index:
                self._heap[index], self._heap[largest] = self._heap[largest], self._heap[index]
                index = largest
            else:
                break

    def enqueue(self, item: Any, severity: int) -> None:
        """Enqueue an emergency patient with a severity rating (e.g., 1-10). O(log n) time."""
        entry = (severity, self._entry_counter, item)
        self._entry_counter += 1
        self._heap.append(entry)
        self._sift_up(len(self._heap) - 1)

    def dequeue(self) -> Any:
        """Extract and return highest severity patient. O(log n) time."""
        if self.is_empty():
            raise IndexError("dequeue from empty priority queue")
        
        root_entry = self._heap[0]
        last_entry = self._heap.pop()
        
        if len(self._heap) > 0:
            self._heap[0] = last_entry
            self._sift_down(0)
            
        return root_entry[2]

    def peek(self) -> Optional[Any]:
        """Return highest severity patient without removing. O(1) time."""
        if self.is_empty():
            return None
        return self._heap[0][2]

    def peek_severity(self) -> Optional[int]:
        if self.is_empty():
            return None
        return self._heap[0][0]

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def __len__(self) -> int:
        return len(self._heap)

    def to_list(self) -> List[dict]:
        """Returns items in ranked priority order without destroying the heap."""
        # Copy heap array and extract progressively
        temp_heap = [x for x in self._heap]
        temp_pq = PriorityQueue()
        temp_pq._heap = temp_heap
        res = []
        while not temp_pq.is_empty():
            sev = temp_pq._heap[0][0]
            val = temp_pq.dequeue()
            res.append({"severity": sev, "data": val})
        return res
