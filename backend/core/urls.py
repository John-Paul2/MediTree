from django.urls import path
from .views import (
    PatientListCreateView,
    PatientDetailSearchView,
    TriageEnqueueView,
    TriageNextView,
    TriageStatusView,
    PatientVisitsView,
    PatientVisitNavigateView,
    DiagnoseView,
    DiseaseGraphView,
    DiseaseBFSView,
    DiseaseDFSView,
    BenchmarkView,
)

urlpatterns = [
    # Patients & Sorting/Searching
    path('patients/', PatientListCreateView.as_view(), name='patient-list-create'),
    path('patients/<int:pk>/', PatientDetailSearchView.as_view(), name='patient-detail-search'),
    
    # Triage Scheduling (CO1)
    path('triage/', TriageEnqueueView.as_view(), name='triage-enqueue'),
    path('triage/next/', TriageNextView.as_view(), name='triage-next'),
    path('triage/status/', TriageStatusView.as_view(), name='triage-status'),

    # Patient Visits & Doubly Linked List (CO2)
    path('patients/<int:pk>/visits/', PatientVisitsView.as_view(), name='patient-visits'),
    path('patients/<int:pk>/visits/navigate/', PatientVisitNavigateView.as_view(), name='patient-visits-navigate'),

    # AI Decision Tree Diagnosis (CO4)
    path('diagnose/', DiagnoseView.as_view(), name='diagnose'),

    # Disease Progression & Graph Traversal (CO5)
    path('disease/graph/', DiseaseGraphView.as_view(), name='disease-graph'),
    path('disease/bfs/', DiseaseBFSView.as_view(), name='disease-bfs'),
    path('disease/dfs/', DiseaseDFSView.as_view(), name='disease-dfs'),

    # Benchmark Suite
    path('benchmark/', BenchmarkView.as_view(), name='benchmark'),
]
