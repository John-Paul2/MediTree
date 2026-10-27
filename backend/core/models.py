from django.db import models


class Patient(models.Model):
    name = models.CharField(max_length=150)
    age = models.IntegerField(default=30)
    gender = models.CharField(max_length=20, default="Other")
    contact = models.CharField(max_length=50, blank=True, default="")
    admission_date = models.DateField()
    billing_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    primary_condition = models.CharField(max_length=200, default="Routine Checkup")
    severity = models.IntegerField(default=1)  # 1 to 10
    is_emergency = models.BooleanField(default=False)
    is_infected = models.BooleanField(default=False)
    blood_group = models.CharField(max_length=10, default="O+")
    department = models.CharField(max_length=100, default="General Medicine")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (ID: {self.id})"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "contact": self.contact,
            "admission_date": str(self.admission_date),
            "billing_amount": float(self.billing_amount),
            "primary_condition": self.primary_condition,
            "severity": self.severity,
            "is_emergency": self.is_emergency,
            "is_infected": self.is_infected,
            "blood_group": self.blood_group,
            "department": self.department,
        }


class Visit(models.Model):
    patient = models.ForeignKey(Patient, related_name='visits', on_delete=models.CASCADE)
    visit_date = models.DateField()
    doctor_name = models.CharField(max_length=150, default="Dr. Sarah Connor")
    diagnosis = models.CharField(max_length=255)
    prescription = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    vitals = models.CharField(max_length=255, default="BP: 120/80 | HR: 72 bpm | Temp: 98.6°F | SpO2: 99%")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['visit_date', 'id']

    def __str__(self):
        return f"Visit {self.id} - Patient {self.patient_id} on {self.visit_date}"

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "visit_date": str(self.visit_date),
            "doctor_name": self.doctor_name,
            "diagnosis": self.diagnosis,
            "prescription": self.prescription,
            "notes": self.notes,
            "vitals": self.vitals,
        }


class ContactEdge(models.Model):
    patient_a = models.ForeignKey(Patient, related_name='contacts_from', on_delete=models.CASCADE)
    patient_b = models.ForeignKey(Patient, related_name='contacts_to', on_delete=models.CASCADE)
    contact_type = models.CharField(max_length=100, default="Community Transmission")
    risk_score = models.FloatField(default=0.75)

    def __str__(self):
        return f"{self.patient_a_id} <-> {self.patient_b_id} ({self.contact_type})"
