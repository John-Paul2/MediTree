from rest_framework import serializers
from .models import Patient, Visit, ContactEdge


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = '__all__'


class PatientSerializer(serializers.ModelSerializer):
    visits = VisitSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'


class ContactEdgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactEdge
        fields = '__all__'
