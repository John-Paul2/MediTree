"""
Seed script: seeds ~50 sample patients with diverse severities (1-10),
longitudinal clinical visits, and contact graph edges for MediTree.
"""

import os
import sys
import django
import random
from datetime import date, timedelta

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentry_health.settings')
django.setup()

from core.models import Patient, Visit, ContactEdge
from core.views import ensure_data_hydrated, TRIAGE_PRIORITY_QUEUE, TRIAGE_ROUTINE_QUEUE, PATIENT_HASH_TABLE, PATIENT_B_TREE, PATIENT_VISIT_REGISTRY, EPIDEMIC_GRAPH

FIRST_NAMES = [
    "Alexander", "Beatrix", "Caleb", "Daphne", "Elena", "Felix", "Genevieve",
    "Hugo", "Isla", "Julian", "Kira", "Liam", "Mina", "Nathan", "Ophelia",
    "Preston", "Quinn", "Rowan", "Sasha", "Tristan", "Uma", "Victor",
    "Wren", "Xavier", "Yara", "Zachary", "Aria", "Blake", "Cassian", "Diana",
    "Ezra", "Freya", "Gideon", "Hazel", "Isaiah", "Jocelyn", "Kai", "Luna",
    "Maddox", "Nova", "Orion", "Penelope", "Ronan", "Stella", "Theo", "Violet",
    "Wyatt", "Zuri", "Silas", "Maeve"
]

LAST_NAMES = [
    "Vance", "Sterling", "Cross", "Mercer", "Blackwood", "Sinclair", "Davenport",
    "Hawthorne", "Kovacs", "Moreau", "Novak", "Price", "Reyes", "Thorne",
    "Winter", "Ashford", "Chen", "Dubois", "Fletcher", "Gallagher", "Holloway",
    "Kim", "Lindqvist", "Morrison", "Nakamura", "O'Connor", "Petrov", "Quincy",
    "Russo", "Sullivan", "Tanaka", "Underwood", "Vargas", "Watanabe", "Yilmaz"
]

# Curated catalog across severities 1 to 10
CATALOG = [
    # Sev 10 (Critical Life-Threatening Emergency)
    ("Acute Coronary Syndrome", 10, True, "Emergency Resuscitation"),
    ("Severe Anaphylactic Shock", 10, True, "Emergency Resuscitation"),
    # Sev 9 (High-Priority ICU Emergency)
    ("Acute Cerebrovascular Event (Stroke)", 9, True, "Neuro-ICU"),
    ("Pulmonary Embolism", 9, True, "Pulmonology Emergency"),
    ("Bacterial Meningitis", 9, True, "Infectious Disease ICU"),
    # Sev 8 (Urgent Surgical / Acute Care)
    ("Severe Bacterial Pneumonia with Sepsis Risk", 8, True, "Respiratory ICU"),
    ("Acute Appendicitis", 8, True, "General Surgery"),
    # Sev 7 (Priority Acute Admission)
    ("Dengue Hemorrhagic Fever", 7, True, "Infectious Diseases"),
    ("Acute Pyelonephritis with High Fever", 7, True, "Urology Acute"),
    # Sev 6 (Urgent Observation)
    ("Hypertensive Urgency", 6, True, "Cardiology Observation"),
    ("Diabetic Ketoacidosis (Moderate)", 6, True, "Endocrine Acute"),
    # Sev 5 (Standard Emergency Observation)
    ("Acute Asthma Exacerbation", 5, True, "Pulmonology Clinic"),
    ("Closed Fracture with Pain Management", 5, True, "Orthopedics Acute"),
    # Sev 4 (Moderate Outpatient / Routine)
    ("Acute Bronchitis", 4, False, "Pulmonology Clinic"),
    ("Influenza A (Seasonal Flu)", 4, False, "General Medicine"),
    ("Complicated Migraine", 4, False, "Neurology Clinic"),
    # Sev 3 (Mild Acute Outpatient)
    ("Acute Viral Gastroenteritis", 3, False, "Internal Medicine"),
    ("Uncomplicated Urinary Tract Infection", 3, False, "Family Medicine"),
    ("Streptococcal Pharyngitis", 3, False, "ENT Outpatient"),
    # Sev 2 (Chronic Routine Maintenance)
    ("Type 2 Diabetes Routine Followup", 2, False, "Endocrinology"),
    ("Allergic Rhinitis / Seasonal Hayfever", 2, False, "Allergy & Immunology"),
    ("Lumbar Muscle Strain", 2, False, "Physiotherapy"),
    ("Essential Hypertension Maintenance", 2, False, "Cardiology Outpatient"),
    # Sev 1 (Wellness / Asymptomatic Check)
    ("Annual Preventive Wellness Evaluation", 1, False, "Primary Care Clinic"),
    ("Pre-employment Health Clearance", 1, False, "Occupational Health"),
    ("Vaccination Booster Consult", 1, False, "Preventive Health"),
]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
GENDERS = ["Female", "Male", "Non-binary"]
DOCTORS = [
    "Dr. Aris Thorne (Cardiology)",
    "Dr. Elena Rostova (Infectious Diseases)",
    "Dr. Marcus Vance (Emergency Medicine)",
    "Dr. Chloe Laurent (Pulmonology)",
    "Dr. Dev Patel (General Surgery)",
    "Dr. Miriam Sachs (Neurology)"
]


def seed():
    print("Clearing previous records...")
    ContactEdge.objects.all().delete()
    Visit.objects.all().delete()
    Patient.objects.all().delete()

    # Reset in-memory data structures
    while not TRIAGE_PRIORITY_QUEUE.is_empty():
        TRIAGE_PRIORITY_QUEUE.dequeue()
    while not TRIAGE_ROUTINE_QUEUE.is_empty():
        TRIAGE_ROUTINE_QUEUE.dequeue()

    print("Generating 50 realistic patient records with diverse severities (1 to 10)...")
    base_date = date(2026, 9, 1)
    patients = []

    for i in range(50):
        first = FIRST_NAMES[i % len(FIRST_NAMES)]
        last = LAST_NAMES[i % len(LAST_NAMES)]
        name = f"{first} {last}"
        age = random.randint(18, 84)
        gender = random.choice(GENDERS)
        contact = f"+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
        admit_date = base_date + timedelta(days=random.randint(0, 56))

        # Rotate through curated catalog to ensure uniform spread of severities
        condition, severity, is_emerg, dept = CATALOG[i % len(CATALOG)]

        base_bill = float(random.randint(90, 450))
        if severity >= 8:
            billing = round(base_bill * random.uniform(8.0, 18.0), 2)
        elif severity >= 5:
            billing = round(base_bill * random.uniform(3.0, 6.0), 2)
        else:
            billing = round(base_bill * random.uniform(1.0, 2.2), 2)

        is_infected = (severity >= 6 and ("Pneumonia" in condition or "Dengue" in condition or "Flu" in condition or "Meningitis" in condition)) or (random.random() < 0.25)

        p = Patient.objects.create(
            name=name,
            age=age,
            gender=gender,
            contact=contact,
            admission_date=admit_date,
            billing_amount=billing,
            primary_condition=condition,
            severity=severity,
            is_emergency=is_emerg,
            is_infected=is_infected,
            blood_group=random.choice(BLOOD_GROUPS),
            department=dept
        )
        patients.append(p)

    print(f"Created {len(patients)} patients.")

    print("Generating longitudinal clinical visits (Doubly Linked List)...")
    visit_notes = [
        "Patient presented with acute escalation. Vitals stabilized post-treatment.",
        "Routine checkup. Responsive to prescribed medical regimen.",
        "Followup examination conducted. Lab blood work shows normalized counts.",
        "Administered intravenous medications and scheduled diagnostic imaging.",
        "Patient reported symptom relief. Vital signs within normal clinical ranges."
    ]

    total_visits = 0
    for p in patients[:25]:
        num_visits = random.randint(2, 5)
        curr_visit_date = p.admission_date - timedelta(days=num_visits * 14)
        for v_idx in range(num_visits):
            curr_visit_date += timedelta(days=random.randint(10, 20))
            Visit.objects.create(
                patient=p,
                visit_date=curr_visit_date,
                doctor_name=random.choice(DOCTORS),
                diagnosis=f"{p.primary_condition} (Stage {v_idx + 1})",
                prescription=f"Rx: Protocol regimen #{v_idx + 101} - Standard dosage twice daily.",
                notes=random.choice(visit_notes),
                vitals=f"BP: {random.randint(110, 145)}/{random.randint(70, 95)} | HR: {random.randint(65, 105)} bpm | Temp: {round(random.uniform(97.8, 102.5), 1)}°F | SpO2: {random.randint(92, 100)}%"
            )
            total_visits += 1

    print(f"Created {total_visits} visit log entries.")

    print("Generating epidemiological contact graph edges (BFS/DFS clusters)...")
    edges_created = 0
    cluster_1 = patients[:15]
    for i in range(len(cluster_1) - 1):
        ContactEdge.objects.create(
            patient_a=cluster_1[i],
            patient_b=cluster_1[i+1],
            contact_type="Household / Close Family",
            risk_score=0.9
        )
        edges_created += 1

    ContactEdge.objects.create(patient_a=cluster_1[0], patient_b=cluster_1[4], contact_type="Hospital Ward A", risk_score=0.85)
    ContactEdge.objects.create(patient_a=cluster_1[1], patient_b=cluster_1[6], contact_type="Transit Commute", risk_score=0.6)
    ContactEdge.objects.create(patient_a=cluster_1[2], patient_b=cluster_1[8], contact_type="Workplace Shared Office", risk_score=0.75)
    ContactEdge.objects.create(patient_a=cluster_1[4], patient_b=cluster_1[10], contact_type="Community Gathering", risk_score=0.7)
    edges_created += 4

    cluster_2 = patients[15:35]
    for i in range(len(cluster_2) - 1):
        if random.random() < 0.65:
            ContactEdge.objects.create(
                patient_a=cluster_2[i],
                patient_b=cluster_2[i+1],
                contact_type=random.choice(["Workplace", "Public Transit", "Clinic Waiting Room"]),
                risk_score=round(random.uniform(0.5, 0.85), 2)
            )
            edges_created += 1

    ContactEdge.objects.create(patient_a=patients[3], patient_b=patients[18], contact_type="Inter-facility Transfer", risk_score=0.8)
    ContactEdge.objects.create(patient_a=patients[7], patient_b=patients[25], contact_type="Supermarket Contact", risk_score=0.55)
    edges_created += 2

    print(f"Created {edges_created} contact network edges.")
    print("Hydrating in-memory custom data structures...")
    # Force rehydration
    import core.views
    core.views._DATA_INITIALIZED = False
    ensure_data_hydrated()
    print("Database seeding and data structure hydration complete!")


if __name__ == '__main__':
    seed()
