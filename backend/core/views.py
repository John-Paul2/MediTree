import time
import random
from typing import Dict, Any, List
from django.db.models import Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Patient, Visit, ContactEdge
from .serializers import PatientSerializer, VisitSerializer, ContactEdgeSerializer
from algorithms import (
    Stack, Queue, PriorityQueue,
    DoublyLinkedList, HashTable,
    merge_sort, binary_search, interpolation_search, linear_search,
    SymptomDecisionTree, BTree, ContactGraph
)

# ==============================================================================
# GLOBAL IN-MEMORY DATA STRUCTURE INSTANCES (Hydrated from DB)
# ==============================================================================

TRIAGE_PRIORITY_QUEUE = PriorityQueue()
TRIAGE_ROUTINE_QUEUE = Queue()
PATIENT_HASH_TABLE = HashTable(capacity=101)
PATIENT_B_TREE = BTree(t=3)
PATIENT_VISIT_REGISTRY: Dict[int, DoublyLinkedList] = {}
EPIDEMIC_GRAPH = ContactGraph()
DIAGNOSTIC_TREE = SymptomDecisionTree()

_DATA_INITIALIZED = False


def ensure_data_hydrated():
    """Hydrates all scratch in-memory data structures from PostgreSQL / SQLite database."""
    global _DATA_INITIALIZED
    if _DATA_INITIALIZED:
        return

    try:
        patients = list(Patient.objects.all().prefetch_related('visits'))
        for p in patients:
            p_dict = p.to_dict()
            PATIENT_HASH_TABLE.insert(p.id, p_dict)
            PATIENT_B_TREE.insert(p.id, p_dict)
            EPIDEMIC_GRAPH.add_patient_node(p.id, p_dict)

            # Build Doubly Linked List for each patient's visits
            dll = DoublyLinkedList()
            for v in p.visits.all().order_by('visit_date', 'id'):
                dll.append(v.to_dict())
            PATIENT_VISIT_REGISTRY[p.id] = dll

            # Add to triage queue if emergency / recent
            if p.is_emergency and p.severity >= 5:
                TRIAGE_PRIORITY_QUEUE.enqueue(p_dict, p.severity)
            elif not p.is_emergency and p.severity <= 4:
                TRIAGE_ROUTINE_QUEUE.enqueue(p_dict)

        # Hydrate contact graph edges
        edges = ContactEdge.objects.all()
        for e in edges:
            EPIDEMIC_GRAPH.add_contact_edge(
                e.patient_a_id, e.patient_b_id,
                contact_type=e.contact_type,
                risk=e.risk_score
            )

        _DATA_INITIALIZED = True
    except Exception as exc:
        print(f"Hydration notice (DB may not be migrated yet): {exc}")


# ==============================================================================
# PATIENT LIST & CREATE (Merge Sort)
# ==============================================================================

class PatientListCreateView(APIView):
    def get(self, request):
        ensure_data_hydrated()
        sort_by = request.query_params.get('sort', 'id').lower()
        order = request.query_params.get('order', 'asc').lower()
        reverse = (order == 'desc')

        patients = list(Patient.objects.all())
        p_dicts = [p.to_dict() for p in patients]

        t0 = time.perf_counter()
        if sort_by == 'date':
            # Custom Merge Sort by admission_date (ISO string)
            sorted_patients = merge_sort(p_dicts, key=lambda x: x['admission_date'], reverse=reverse)
            algo_info = "Merge Sort O(n log n) by Admission Date"
        elif sort_by == 'billing':
            # Custom Merge Sort by billing_amount (float)
            sorted_patients = merge_sort(p_dicts, key=lambda x: x['billing_amount'], reverse=reverse)
            algo_info = "Merge Sort O(n log n) by Billing Amount"
        elif sort_by == 'severity':
            sorted_patients = merge_sort(p_dicts, key=lambda x: x['severity'], reverse=reverse)
            algo_info = "Merge Sort O(n log n) by Severity Rating"
        else:
            sorted_patients = merge_sort(p_dicts, key=lambda x: x['id'], reverse=reverse)
            algo_info = "Merge Sort O(n log n) by Patient ID"
        elapsed_ms = (time.perf_counter() - t0) * 1000

        return Response({
            "count": len(sorted_patients),
            "algorithm": algo_info,
            "sort_field": sort_by,
            "order": order,
            "time_ms": round(elapsed_ms, 4),
            "results": sorted_patients
        })

    def post(self, request):
        ensure_data_hydrated()
        serializer = PatientSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            p_dict = patient.to_dict()

            # Synchronize custom data structures
            PATIENT_HASH_TABLE.insert(patient.id, p_dict)
            PATIENT_B_TREE.insert(patient.id, p_dict)
            EPIDEMIC_GRAPH.add_patient_node(patient.id, p_dict)
            PATIENT_VISIT_REGISTRY[patient.id] = DoublyLinkedList()

            if patient.is_emergency:
                TRIAGE_PRIORITY_QUEUE.enqueue(p_dict, severity=patient.severity)
            else:
                TRIAGE_ROUTINE_QUEUE.enqueue(p_dict)

            return Response(p_dict, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# PATIENT SEARCH (Binary, Interpolation, Hash Table, B-Tree)
# ==============================================================================

class PatientDetailSearchView(APIView):
    def get(self, request, pk):
        ensure_data_hydrated()
        search_method = request.query_params.get('method', 'hash').lower()

        try:
            target_id = int(pk)
        except ValueError:
            target_id = pk

        t0 = time.perf_counter()
        found_record = None
        steps = 0
        complexity = "O(1)"
        path_trace = []

        if search_method == 'hash':
            complexity = "Average O(1) [Custom Separate-Chaining Hash Table]"
            found_record, steps = PATIENT_HASH_TABLE.get(target_id)
        elif search_method == 'binary':
            complexity = "O(log n) [Custom Binary Search]"
            # In-order B-Tree traversal or sorted list of IDs
            all_records = [val for _, val in PATIENT_B_TREE.in_order_traversal()]
            if not all_records:
                all_records = [p.to_dict() for p in Patient.objects.all().order_by('id')]
            idx, steps = binary_search(all_records, target_id, key=lambda x: x['id'])
            if idx is not None:
                found_record = all_records[idx]
        elif search_method == 'interpolation':
            complexity = "Average O(log log n) [Custom Interpolation Search]"
            all_records = [val for _, val in PATIENT_B_TREE.in_order_traversal()]
            if not all_records:
                all_records = [p.to_dict() for p in Patient.objects.all().order_by('id')]
            idx, steps = interpolation_search(all_records, target_id, key=lambda x: x['id'])
            if idx is not None:
                found_record = all_records[idx]
        elif search_method == 'btree':
            complexity = "O(log_t n) [Custom Order-3 B-Tree Search]"
            found_record, steps, path_trace = PATIENT_B_TREE.search(target_id)
        else:
            # Fallback
            found_record, steps = PATIENT_HASH_TABLE.get(target_id)
            complexity = "Hash Table"

        elapsed_ms = (time.perf_counter() - t0) * 1000

        if found_record is None:
            # Check DB directly if not in-memory
            try:
                p = Patient.objects.get(pk=target_id)
                found_record = p.to_dict()
                PATIENT_HASH_TABLE.insert(p.id, found_record)
                PATIENT_B_TREE.insert(p.id, found_record)
            except Patient.DoesNotExist:
                return Response({
                    "error": f"Patient ID {pk} not found",
                    "method": search_method,
                    "steps": steps,
                    "time_ms": round(elapsed_ms, 4)
                }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "patient": found_record,
            "search_method": search_method,
            "steps_compared": steps,
            "time_ms": round(elapsed_ms, 4),
            "complexity": complexity,
            "path_trace": path_trace
        })


# ==============================================================================
# TRIAGE ENGINE & QUEUES (CO1: PriorityQueue & Queue)
# ==============================================================================

class TriageEnqueueView(APIView):
    def post(self, request):
        ensure_data_hydrated()
        data = request.data
        patient_id = data.get('patient_id')
        name = data.get('name', 'Anonymous Patient')
        symptoms = data.get('symptoms', {})
        is_emergency_input = data.get('is_emergency', False)

        # 1. Walk Binary Decision Tree for AI Diagnosis (CO4)
        diag_result = DIAGNOSTIC_TREE.diagnose(symptoms)
        severity = diag_result['severity_score']
        diagnosis = diag_result['diagnosis']

        # Determine if emergency: true if explicit flag OR severity >= 7
        is_emergency = is_emergency_input or (severity >= 7)

        # Check or create patient
        if patient_id:
            try:
                patient = Patient.objects.get(pk=patient_id)
                patient.primary_condition = diagnosis
                patient.severity = severity
                patient.is_emergency = is_emergency
                patient.save()
                p_dict = patient.to_dict()
            except Patient.DoesNotExist:
                p_dict = {
                    "id": patient_id, "name": name, "severity": severity,
                    "is_emergency": is_emergency, "primary_condition": diagnosis
                }
        else:
            patient = Patient.objects.create(
                name=name,
                age=data.get('age', 35),
                gender=data.get('gender', 'Other'),
                admission_date=data.get('admission_date', '2026-10-27'),
                billing_amount=data.get('billing_amount', 150.0),
                primary_condition=diagnosis,
                severity=severity,
                is_emergency=is_emergency,
                department="Emergency Unit" if is_emergency else "Outpatient Clinic"
            )
            p_dict = patient.to_dict()
            PATIENT_HASH_TABLE.insert(patient.id, p_dict)
            PATIENT_B_TREE.insert(patient.id, p_dict)
            EPIDEMIC_GRAPH.add_patient_node(patient.id, p_dict)
            PATIENT_VISIT_REGISTRY[patient.id] = DoublyLinkedList()

        # Enqueue based on priority
        queue_type = "emergency_priority_queue" if is_emergency else "routine_fifo_queue"
        if is_emergency:
            TRIAGE_PRIORITY_QUEUE.enqueue(p_dict, severity=severity)
            queue_position = len(TRIAGE_PRIORITY_QUEUE)
        else:
            TRIAGE_ROUTINE_QUEUE.enqueue(p_dict)
            queue_position = len(TRIAGE_ROUTINE_QUEUE)

        return Response({
            "message": f"Patient enqueued successfully into {queue_type.replace('_', ' ').title()}",
            "patient": p_dict,
            "diagnosis": diag_result,
            "queue_type": queue_type,
            "queue_position": queue_position,
            "priority_queue_length": len(TRIAGE_PRIORITY_QUEUE),
            "routine_queue_length": len(TRIAGE_ROUTINE_QUEUE)
        }, status=status.HTTP_201_CREATED)


class TriageNextView(APIView):
    def post(self, request):
        ensure_data_hydrated()
        # CO1 Specification: Critical patients in Priority Queue treated first;
        # Routine FIFO Queue processed once emergency queue is clear.
        if not TRIAGE_PRIORITY_QUEUE.is_empty():
            patient = TRIAGE_PRIORITY_QUEUE.dequeue()
            source = "Emergency Priority Queue (Highest Severity Dequeued First)"
        elif not TRIAGE_ROUTINE_QUEUE.is_empty():
            patient = TRIAGE_ROUTINE_QUEUE.dequeue()
            source = "Routine FIFO Appointment Queue (First-In, First-Out)"
        else:
            return Response({
                "message": "All queues are currently empty. No patients waiting.",
                "patient": None,
                "priority_queue_length": 0,
                "routine_queue_length": 0
            })

        return Response({
            "message": f"Next patient summoned from {source}",
            "source_queue": source,
            "patient": patient,
            "priority_queue_length": len(TRIAGE_PRIORITY_QUEUE),
            "routine_queue_length": len(TRIAGE_ROUTINE_QUEUE)
        })


class TriageStatusView(APIView):
    def get(self, request):
        ensure_data_hydrated()
        next_emergency = TRIAGE_PRIORITY_QUEUE.peek()
        next_emergency_sev = TRIAGE_PRIORITY_QUEUE.peek_severity()
        next_routine = TRIAGE_ROUTINE_QUEUE.peek()

        return Response({
            "priority_queue": {
                "length": len(TRIAGE_PRIORITY_QUEUE),
                "next_patient": next_emergency,
                "next_severity": next_emergency_sev,
                "items": TRIAGE_PRIORITY_QUEUE.to_list()[:10]  # First 10 preview
            },
            "routine_queue": {
                "length": len(TRIAGE_ROUTINE_QUEUE),
                "next_patient": next_routine,
                "items": TRIAGE_ROUTINE_QUEUE.to_list()[:10]
            },
            "total_waiting": len(TRIAGE_PRIORITY_QUEUE) + len(TRIAGE_ROUTINE_QUEUE)
        })


# ==============================================================================
# PATIENT VISITS & DOUBLY LINKED LIST NAVIGATION (CO2)
# ==============================================================================

class PatientVisitsView(APIView):
    def get(self, request, pk):
        ensure_data_hydrated()
        try:
            p_id = int(pk)
        except ValueError:
            return Response({"error": "Invalid patient ID"}, status=status.HTTP_400_BAD_REQUEST)

        dll = PATIENT_VISIT_REGISTRY.get(p_id)
        if dll is None:
            # Reconstruct from DB
            dll = DoublyLinkedList()
            visits = Visit.objects.filter(patient_id=p_id).order_by('visit_date', 'id')
            for v in visits:
                dll.append(v.to_dict())
            PATIENT_VISIT_REGISTRY[p_id] = dll

        visits_list = dll.to_list()
        current_node = dll.current()

        return Response({
            "patient_id": p_id,
            "total_visits": len(dll),
            "current_cursor": current_node,
            "visits": visits_list,
            "data_structure": "Doubly Linked List (O(1) prev/next navigation)"
        })

    def post(self, request, pk):
        ensure_data_hydrated()
        try:
            p_id = int(pk)
            patient = Patient.objects.get(pk=p_id)
        except (ValueError, Patient.DoesNotExist):
            return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['patient'] = patient.id
        serializer = VisitSerializer(data=data)
        if serializer.is_valid():
            visit = serializer.save()
            v_dict = visit.to_dict()

            dll = PATIENT_VISIT_REGISTRY.setdefault(p_id, DoublyLinkedList())
            dll.append(v_dict)

            return Response({
                "message": "Visit logged into Doubly Linked List",
                "visit": v_dict,
                "current_cursor": dll.current(),
                "total_visits": len(dll)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientVisitNavigateView(APIView):
    def get(self, request, pk):
        ensure_data_hydrated()
        action = request.query_params.get('action', 'current').lower()
        try:
            p_id = int(pk)
        except ValueError:
            return Response({"error": "Invalid patient ID"}, status=status.HTTP_400_BAD_REQUEST)

        dll = PATIENT_VISIT_REGISTRY.get(p_id)
        if dll is None:
            dll = DoublyLinkedList()
            for v in Visit.objects.filter(patient_id=p_id).order_by('visit_date', 'id'):
                dll.append(v.to_dict())
            PATIENT_VISIT_REGISTRY[p_id] = dll

        if action == 'next':
            node = dll.move_next()
        elif action == 'prev':
            node = dll.move_prev()
        elif action == 'reset_head':
            node = dll.reset_to_head()
        elif action == 'reset_tail':
            node = dll.reset_to_tail()
        else:
            node = dll.current()

        return Response({
            "patient_id": p_id,
            "action": action,
            "node": node,
            "has_next": node['has_next'] if node else False,
            "has_prev": node['has_prev'] if node else False,
            "total_visits": len(dll)
        })


# ==============================================================================
# AI SYMPTOM DIAGNOSIS (CO4: Binary Decision Tree)
# ==============================================================================

class DiagnoseView(APIView):
    def post(self, request):
        symptoms = request.data.get('symptoms', {})
        result = DIAGNOSTIC_TREE.diagnose(symptoms)
        return Response(result)

    def get(self, request):
        # Return full tree schema for visualization
        return Response(DIAGNOSTIC_TREE.get_tree_structure())


# ==============================================================================
# DISEASE TRACKER & EPIDEMIOLOGY (CO5: Graph, BFS, DFS)
# ==============================================================================

class DiseaseGraphView(APIView):
    def get(self, request):
        ensure_data_hydrated()
        return Response(EPIDEMIC_GRAPH.get_full_graph())


class DiseaseBFSView(APIView):
    def get(self, request):
        ensure_data_hydrated()
        start_id = request.query_params.get('start', '1')
        depth = int(request.query_params.get('depth', 2))
        res = EPIDEMIC_GRAPH.bfs_transmission_radius(start_id, max_depth=depth)
        return Response(res)


class DiseaseDFSView(APIView):
    def get(self, request):
        ensure_data_hydrated()
        start_id = request.query_params.get('start', '1')
        res = EPIDEMIC_GRAPH.dfs_trace_origin(start_id)
        return Response(res)


# ==============================================================================
# PERFORMANCE BENCHMARK SUITE (CO2, CO3, CO5 Complexity Validation)
# ==============================================================================

class BenchmarkView(APIView):
    def get(self, request):
        """Runs empirical timing tests on Merge Sort vs Built-in Timsort,
        and Binary vs Interpolation vs Linear vs Hash Table search.
        """
        sizes = [100, 500, 1000, 2500, 5000]
        sort_results = []
        search_results = []

        for n in sizes:
            # Generate random numbers
            nums = [random.randint(1, n * 10) for _ in range(n)]

            # 1. Custom Merge Sort Timing
            t0 = time.perf_counter()
            sorted_custom = merge_sort(nums)
            custom_sort_ms = (time.perf_counter() - t0) * 1000

            # 2. Python Built-in Timsort Timing
            t0 = time.perf_counter()
            sorted_builtin = sorted(nums)
            builtin_sort_ms = (time.perf_counter() - t0) * 1000

            sort_results.append({
                "n": n,
                "merge_sort_ms": round(custom_sort_ms, 3),
                "builtin_sort_ms": round(builtin_sort_ms, 3),
                "speedup_ratio": round(custom_sort_ms / max(builtin_sort_ms, 0.0001), 2)
            })

            # Search Benchmark with uniformly spaced sorted array
            sorted_array = sorted_builtin
            target = random.choice(sorted_array)

            # Linear Search
            t0 = time.perf_counter()
            _, lin_steps = linear_search(sorted_array, target)
            lin_time_us = (time.perf_counter() - t0) * 1_000_000

            # Binary Search
            t0 = time.perf_counter()
            _, bin_steps = binary_search(sorted_array, target)
            bin_time_us = (time.perf_counter() - t0) * 1_000_000

            # Interpolation Search
            t0 = time.perf_counter()
            _, interp_steps = interpolation_search(sorted_array, target)
            interp_time_us = (time.perf_counter() - t0) * 1_000_000

            # Hash Table
            ht = HashTable(capacity=n * 2 + 1)
            for x in sorted_array:
                ht.insert(x, x)
            t0 = time.perf_counter()
            _, hash_steps = ht.get(target)
            hash_time_us = (time.perf_counter() - t0) * 1_000_000

            search_results.append({
                "n": n,
                "linear": {"time_us": round(lin_time_us, 2), "steps": lin_steps},
                "binary": {"time_us": round(bin_time_us, 2), "steps": bin_steps},
                "interpolation": {"time_us": round(interp_time_us, 2), "steps": interp_steps},
                "hash_table": {"time_us": round(hash_time_us, 2), "steps": hash_steps},
            })

        return Response({
            "sorting_benchmark": sort_results,
            "searching_benchmark": search_results,
            "summary": {
                "merge_sort": "O(n log n) Divide & Conquer",
                "binary_search": "O(log n) Halving Search Space",
                "interpolation_search": "O(log log n) Uniform Estimate",
                "hash_table": "O(1) Amortized Constant Time"
            }
        })
