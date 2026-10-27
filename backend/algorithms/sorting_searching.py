"""
Module: sorting_searching.py
Course Outcome: CO3 (Medical Record Sorting & Retrieval)

Implements from scratch without built-in shortcuts:
1. Merge Sort - Stable O(n log n) divide-and-conquer sorting algorithm.
   Can sort patient records by admission date (ISO strings) or billing amounts (floats).
2. Binary Search - O(log n) search on sorted arrays.
3. Interpolation Search - O(log log n) average search for uniformly distributed sorted numeric keys.
4. Linear Search - O(n) baseline search used for benchmark comparisons.
"""

from typing import Any, Callable, List, Optional, Tuple


# ==============================================================================
# MERGE SORT (Pure O(n log n) Divide & Conquer)
# ==============================================================================

def merge_sort(items: List[Any], key: Optional[Callable[[Any], Any]] = None, reverse: bool = False) -> List[Any]:
    """Sorts a list of records using Merge Sort from scratch.
    
    Args:
        items: List of elements or dicts to sort.
        key: Extractor function for the comparison attribute (e.g. lambda x: x['billing_amount']).
        reverse: If True, sort in descending order.
        
    Returns:
        A new sorted list.
    """
    if len(items) <= 1:
        return list(items)

    mid = len(items) // 2
    left_half = merge_sort(items[:mid], key=key, reverse=reverse)
    right_half = merge_sort(items[mid:], key=key, reverse=reverse)

    return _merge(left_half, right_half, key=key, reverse=reverse)


def _merge(left: List[Any], right: List[Any], key: Optional[Callable[[Any], Any]] = None, reverse: bool = False) -> List[Any]:
    """Merges two sorted lists into one sorted list."""
    merged = []
    i = 0
    j = 0

    while i < len(left) and j < len(right):
        val_l = key(left[i]) if key else left[i]
        val_r = key(right[j]) if key else right[j]

        # Handle None comparisons safely
        if val_l is None:
            val_l = "" if isinstance(val_r, str) else 0
        if val_r is None:
            val_r = "" if isinstance(val_l, str) else 0

        if reverse:
            condition = val_l >= val_r
        else:
            condition = val_l <= val_r

        if condition:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1

    while i < len(left):
        merged.append(left[i])
        i += 1

    while j < len(right):
        merged.append(right[j])
        j += 1

    return merged


# ==============================================================================
# BINARY SEARCH
# ==============================================================================

def binary_search(sorted_items: List[Any], target_val: Any, key: Optional[Callable[[Any], Any]] = None) -> Tuple[Optional[int], int]:
    """Performs binary search on a pre-sorted list.
    
    Returns:
        (index, comparison_steps) where index is None if target is not found.
    """
    low = 0
    high = len(sorted_items) - 1
    steps = 0

    while low <= high:
        steps += 1
        mid = (low + high) // 2
        curr_val = key(sorted_items[mid]) if key else sorted_items[mid]

        # Attempt type alignment if one is string and other integer
        try:
            curr_val_num = int(curr_val)
            target_val_num = int(target_val)
            match = curr_val_num == target_val_num
            less_than = curr_val_num < target_val_num
        except (ValueError, TypeError):
            match = str(curr_val) == str(target_val)
            less_than = str(curr_val) < str(target_val)

        if match:
            return mid, steps
        elif less_than:
            low = mid + 1
        else:
            high = mid - 1

    return None, steps


# ==============================================================================
# INTERPOLATION SEARCH
# ==============================================================================

def interpolation_search(sorted_items: List[Any], target_val: int, key: Optional[Callable[[Any], Any]] = None) -> Tuple[Optional[int], int]:
    """Performs interpolation search on a sorted list with uniformly distributed numeric keys.
    Formula: pos = low + [ (target - arr[low]) * (high - low) // (arr[high] - arr[low]) ]
    
    Returns:
        (index, comparison_steps) where index is None if target is not found.
    """
    if not sorted_items:
        return None, 0

    try:
        target_num = int(target_val)
    except (ValueError, TypeError):
        # Fall back to binary search if target isn't convertible to integer
        return binary_search(sorted_items, target_val, key)

    low = 0
    high = len(sorted_items) - 1
    steps = 0

    while low <= high:
        steps += 1
        low_val = int(key(sorted_items[low]) if key else sorted_items[low])
        high_val = int(key(sorted_items[high]) if key else sorted_items[high])

        if target_num < low_val or target_num > high_val:
            break

        if low_val == high_val:
            if low_val == target_num:
                return low, steps
            break

        # Linear interpolation formula
        fraction = (target_num - low_val) / (high_val - low_val)
        pos = low + int(fraction * (high - low))

        if pos < low or pos > high:
            break

        pos_val = int(key(sorted_items[pos]) if key else sorted_items[pos])

        if pos_val == target_num:
            return pos, steps
        elif pos_val < target_num:
            low = pos + 1
        else:
            high = pos - 1

    return None, steps


# ==============================================================================
# LINEAR SEARCH (Baseline)
# ==============================================================================

def linear_search(items: List[Any], target_val: Any, key: Optional[Callable[[Any], Any]] = None) -> Tuple[Optional[int], int]:
    """Linear search baseline for benchmarking."""
    steps = 0
    for idx, item in enumerate(items):
        steps += 1
        val = key(item) if key else item
        if str(val) == str(target_val):
            return idx, steps
    return None, steps
