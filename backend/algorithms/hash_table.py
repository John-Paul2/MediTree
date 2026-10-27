"""
Module: hash_table.py
Course Outcome: CO3 / Phase 2 (Fast Patient ID Lookup)

Implements a Hash Table from scratch using separate chaining with linked buckets.
Includes prime-modulo hashing, dynamic rehashing on high load factor, collision tracking,
and lookup step counters to benchmark against Binary Search and Interpolation Search.
"""

from typing import Any, List, Optional, Tuple


class HashNode:
    def __init__(self, key: Any, value: Any):
        self.key = key
        self.value = value
        self.next: Optional['HashNode'] = None


class HashTable:
    """Hash Table using separate chaining and dynamic resizing."""
    INITIAL_CAPACITY = 31

    def __init__(self, capacity: int = INITIAL_CAPACITY):
        self._capacity: int = capacity
        self._size: int = 0
        self._buckets: List[Optional[HashNode]] = [None] * self._capacity
        self._collision_count: int = 0

    def _hash(self, key: Any) -> int:
        """Custom polynomial rolling hash function for integer or string keys."""
        s = str(key)
        h = 0
        prime = 31
        for char in s:
            h = (h * prime + ord(char)) % self._capacity
        return h

    def insert(self, key: Any, value: Any) -> None:
        """Insert or update a (key, value) pair. Average O(1) time."""
        index = self._hash(key)
        curr = self._buckets[index]

        # Check if key already exists
        while curr:
            if curr.key == key:
                curr.value = value
                return
            curr = curr.next

        # Collision check
        if self._buckets[index] is not None:
            self._collision_count += 1

        # Insert at head of bucket chain
        new_node = HashNode(key, value)
        new_node.next = self._buckets[index]
        self._buckets[index] = new_node
        self._size += 1

        # Resize if load factor exceeds threshold
        if self.load_factor() > 0.75:
            self._resize(self._capacity * 2 + 1)

    def get(self, key: Any) -> Tuple[Optional[Any], int]:
        """Lookup value by key. Returns (value, comparison_steps). Average O(1)."""
        index = self._hash(key)
        curr = self._buckets[index]
        steps = 0
        while curr:
            steps += 1
            if str(curr.key) == str(key):
                return curr.value, steps
            curr = curr.next
        return None, steps

    def contains(self, key: Any) -> bool:
        val, _ = self.get(key)
        return val is not None

    def delete(self, key: Any) -> bool:
        index = self._hash(key)
        curr = self._buckets[index]
        prev = None
        while curr:
            if curr.key == key:
                if prev:
                    prev.next = curr.next
                else:
                    self._buckets[index] = curr.next
                self._size -= 1
                return True
            prev = curr
            curr = curr.next
        return False

    def load_factor(self) -> float:
        return self._size / self._capacity

    def _resize(self, new_capacity: int) -> None:
        old_buckets = self._buckets
        self._capacity = new_capacity
        self._buckets = [None] * self._capacity
        self._size = 0
        self._collision_count = 0

        for head in old_buckets:
            curr = head
            while curr:
                self.insert(curr.key, curr.value)
                curr = curr.next

    def items(self) -> List[Tuple[Any, Any]]:
        res = []
        for head in self._buckets:
            curr = head
            while curr:
                res.append((curr.key, curr.value))
                curr = curr.next
        return res

    def __len__(self) -> int:
        return self._size
