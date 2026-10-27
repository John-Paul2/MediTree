"""
Module: binary_tree.py
Course Outcome: CO4 (AI Symptom Classification)

Implements a Binary Decision Tree for automated medical triage and symptom classification.
- Internal Nodes represent binary Yes/No symptom diagnostic questions.
- Leaf Nodes represent illness classifications, recommended action triage, and base severity.
"""

from typing import Any, Dict, List, Optional, Tuple


class DecisionTreeNode:
    """Node in the symptom classification binary decision tree."""
    def __init__(
        self,
        question_or_diagnosis: str,
        is_leaf: bool = False,
        yes_child: Optional['DecisionTreeNode'] = None,
        no_child: Optional['DecisionTreeNode'] = None,
        symptom_key: Optional[str] = None,
        severity_score: int = 1,
        triage_recommendation: str = "Routine Consult",
        prescription_advice: str = ""
    ):
        self.question_or_diagnosis: str = question_or_diagnosis
        self.is_leaf: bool = is_leaf
        self.yes_child: Optional['DecisionTreeNode'] = yes_child
        self.no_child: Optional['DecisionTreeNode'] = no_child
        self.symptom_key: Optional[str] = symptom_key
        self.severity_score: int = severity_score  # 1 to 10
        self.triage_recommendation: str = triage_recommendation
        self.prescription_advice: str = prescription_advice

    def to_dict(self) -> Dict[str, Any]:
        """Serialize tree structure for UI visualizer."""
        data: Dict[str, Any] = {
            "name": self.question_or_diagnosis,
            "is_leaf": self.is_leaf,
            "symptom_key": self.symptom_key,
            "severity": self.severity_score,
            "triage": self.triage_recommendation,
        }
        if not self.is_leaf:
            data["children"] = []
            if self.yes_child:
                child_data = self.yes_child.to_dict()
                child_data["branch"] = "YES"
                data["children"].append(child_data)
            if self.no_child:
                child_data = self.no_child.to_dict()
                child_data["branch"] = "NO"
                data["children"].append(child_data)
        return data


class SymptomDecisionTree:
    """Binary Decision Tree Diagnostic Engine."""
    def __init__(self):
        self.root: DecisionTreeNode = self._build_clinical_tree()

    def _build_clinical_tree(self) -> DecisionTreeNode:
        """Constructs a comprehensive clinical diagnostic tree."""
        # --- Deep Leaf Nodes ---
        leaf_ami = DecisionTreeNode(
            question_or_diagnosis="Acute Coronary Syndrome (Possible Myocardial Infarction)",
            is_leaf=True,
            severity_score=10,
            triage_recommendation="Immediate Emergency Resuscitation (Code Red)",
            prescription_advice="Aspirin 325mg chewable, Sublingual Nitroglycerin, Urgent ECG and Troponin panel."
        )

        leaf_pe = DecisionTreeNode(
            question_or_diagnosis="Pulmonary Embolism / Acute Respiratory Distress",
            is_leaf=True,
            severity_score=9,
            triage_recommendation="High-Priority Emergency (Code Red)",
            prescription_advice="Oxygen therapy, CT Pulmonary Angiogram, IV anticoagulation protocol."
        )

        leaf_pneumonia = DecisionTreeNode(
            question_or_diagnosis="Severe Bacterial Pneumonia with Sepsis Risk",
            is_leaf=True,
            severity_score=8,
            triage_recommendation="Urgent Emergency Inpatient Admission",
            prescription_advice="Broad-spectrum IV antibiotics (Ceftriaxone + Azithromycin), Chest X-ray, blood cultures."
        )

        leaf_bronchitis = DecisionTreeNode(
            question_or_diagnosis="Acute Bronchitis / Viral Respiratory Tract Infection",
            is_leaf=True,
            severity_score=4,
            triage_recommendation="Routine Outpatient Clinic",
            prescription_advice="Hydration, Dextromethorphan cough syrup, Albuterol inhaler as needed."
        )

        leaf_stroke = DecisionTreeNode(
            question_or_diagnosis="Acute Cerebrovascular Event (Stroke / Intracranial Hemorrhage)",
            is_leaf=True,
            severity_score=10,
            triage_recommendation="Immediate Neuro-Emergency (Code Fast)",
            prescription_advice="Stat Non-contrast Brain CT, neuro-surgery consult, permissive hypertension monitoring."
        )

        leaf_meningitis = DecisionTreeNode(
            question_or_diagnosis="Bacterial Meningitis / CNS Infection",
            is_leaf=True,
            severity_score=9,
            triage_recommendation="Critical Isolation Emergency",
            prescription_advice="Immediate Lumbar Puncture, IV Ceftriaxone + Vancomycin + Dexamethasone."
        )

        leaf_appendicitis = DecisionTreeNode(
            question_or_diagnosis="Acute Appendicitis / Acute Abdomen",
            is_leaf=True,
            severity_score=8,
            triage_recommendation="Urgent Surgical Consult",
            prescription_advice="NPO, IV fluids, Abdominal ultrasound/CT, IV Piperacillin-Tazobactam."
        )

        leaf_gastro = DecisionTreeNode(
            question_or_diagnosis="Acute Viral Gastroenteritis",
            is_leaf=True,
            severity_score=3,
            triage_recommendation="Routine Outpatient Clinic",
            prescription_advice="Oral Rehydration Salts (ORS), Ondansetron for nausea, light BRAT diet."
        )

        leaf_anaphylaxis = DecisionTreeNode(
            question_or_diagnosis="Severe Anaphylactic Shock",
            is_leaf=True,
            severity_score=10,
            triage_recommendation="Immediate Emergency Resuscitation",
            prescription_advice="Intramuscular Epinephrine 0.3mg, IV Diphenhydramine, IV Methylprednisolone."
        )

        leaf_dengue = DecisionTreeNode(
            question_or_diagnosis="Dengue Fever / Hemorrhagic Viral Syndrome",
            is_leaf=True,
            severity_score=7,
            triage_recommendation="Priority Acute Medical Care",
            prescription_advice="Platelet count monitoring, strict Paracetamol (avoid NSAIDs), aggressive hydration."
        )

        leaf_influenza = DecisionTreeNode(
            question_or_diagnosis="Influenza A/B (Seasonal Flu)",
            is_leaf=True,
            severity_score=4,
            triage_recommendation="Standard Outpatient Clinic",
            prescription_advice="Oseltamivir (Tamiflu) if within 48h, Paracetamol 650mg, warm fluids, rest."
        )

        leaf_migraine = DecisionTreeNode(
            question_or_diagnosis="Complicated Migraine / Tension Cephalea",
            is_leaf=True,
            severity_score=4,
            triage_recommendation="Standard Outpatient Clinic",
            prescription_advice="Sumatriptan 50mg, Ibuprofen 400mg, dark quiet room recovery."
        )

        leaf_general_checkup = DecisionTreeNode(
            question_or_diagnosis="Mild Benign Symptoms / General Medical Wellness",
            is_leaf=True,
            severity_score=1,
            triage_recommendation="Routine Consultation Scheduled",
            prescription_advice="Multivitamin support, lifestyle counseling, routine vitals monitoring."
        )

        # --- Intermediate Decision Nodes ---
        # Branch: Chest Pain -> Shortness of breath
        node_chest_sob = DecisionTreeNode(
            question_or_diagnosis="Is the chest pain accompanied by shortness of breath or radiating left arm pain?",
            is_leaf=False,
            symptom_key="radiating_pain",
            yes_child=leaf_ami,
            no_child=leaf_pe
        )

        # Branch: Cough + High Fever
        node_cough_fever = DecisionTreeNode(
            question_or_diagnosis="Is the persistent cough associated with high fever (>102°F) and rust-colored sputum?",
            is_leaf=False,
            symptom_key="high_fever_sputum",
            yes_child=leaf_pneumonia,
            no_child=leaf_bronchitis
        )

        # Branch: Severe Headache -> Sudden neurological deficit / stiff neck
        node_headache_neurologic = DecisionTreeNode(
            question_or_diagnosis="Is there sudden facial drooping, speech difficulty, or severe neck stiffness?",
            is_leaf=False,
            symptom_key="neuro_deficit",
            yes_child=leaf_stroke,
            no_child=leaf_meningitis
        )

        # Branch: Abdominal Pain -> Localized right lower quadrant rebound tenderness
        node_abdominal_rlq = DecisionTreeNode(
            question_or_diagnosis="Is there sharp localized right lower abdominal pain with rebound tenderness?",
            is_leaf=False,
            symptom_key="rlq_tenderness",
            yes_child=leaf_appendicitis,
            no_child=leaf_gastro
        )

        # Branch: Rash & Allergic Reaction
        node_rash_swelling = DecisionTreeNode(
            question_or_diagnosis="Is the rash accompanied by lip/tongue swelling or breathing difficulty?",
            is_leaf=False,
            symptom_key="facial_swelling",
            yes_child=leaf_anaphylaxis,
            no_child=leaf_dengue
        )

        # Branch: Fever without respiratory distress
        node_fever_type = DecisionTreeNode(
            question_or_diagnosis="Is there high prolonged fever with severe retro-orbital eye pain and joint pain?",
            is_leaf=False,
            symptom_key="joint_eye_pain",
            yes_child=leaf_dengue,
            no_child=leaf_influenza
        )

        # Branch: Upper Subtree 2 - Headache vs Fever
        node_headache_or_fever = DecisionTreeNode(
            question_or_diagnosis="Is a severe or unusual headache the primary presenting complaint?",
            is_leaf=False,
            symptom_key="severe_headache",
            yes_child=node_headache_neurologic,
            no_child=node_fever_type
        )

        # Branch: Abdomen vs Rash
        node_abdo_or_rash = DecisionTreeNode(
            question_or_diagnosis="Is there severe abdominal pain or persistent vomiting?",
            is_leaf=False,
            symptom_key="severe_abdominal",
            yes_child=node_abdominal_rlq,
            no_child=node_rash_swelling
        )

        # Branch: Respiratory vs Other non-chest complaints
        node_cough_or_abdo = DecisionTreeNode(
            question_or_diagnosis="Do you have a persistent cough or wheezing?",
            is_leaf=False,
            symptom_key="cough_wheeze",
            yes_child=node_cough_fever,
            no_child=node_abdo_or_rash
        )

        # Branch: Chest pain vs Respiratory/Systemic
        node_non_chest_root = DecisionTreeNode(
            question_or_diagnosis="Are symptoms centered around fever or severe headache?",
            is_leaf=False,
            symptom_key="fever_or_headache",
            yes_child=node_headache_or_fever,
            no_child=node_cough_or_abdo
        )

        # Root Decision Node
        root = DecisionTreeNode(
            question_or_diagnosis="Are you experiencing acute chest pain, chest tightness, or heavy pressure?",
            is_leaf=False,
            symptom_key="acute_chest_pain",
            yes_child=node_chest_sob,
            no_child=node_non_chest_root
        )

        return root

    def diagnose(self, symptom_answers: Dict[str, bool]) -> Dict[str, Any]:
        """Traverses the binary tree using provided answers.
        
        Args:
            symptom_answers: Mapping of symptom keys (or question identifiers) to bool (True=Yes, False=No).
            
        Returns:
            Dict containing:
                - diagnosis: str
                - severity_score: int
                - triage_recommendation: str
                - prescription_advice: str
                - path: List of {question, answer, next_step}
        """
        curr = self.root
        path: List[Dict[str, Any]] = []

        while not curr.is_leaf:
            key = curr.symptom_key or curr.question_or_diagnosis
            # Check answer from dictionary; default to False if unspecified
            ans = bool(symptom_answers.get(key, False))
            
            # Record step in diagnostic path
            path.append({
                "question": curr.question_or_diagnosis,
                "symptom_key": key,
                "answer": "YES" if ans else "NO",
            })

            if ans:
                curr = curr.yes_child if curr.yes_child else curr.no_child
            else:
                curr = curr.no_child if curr.no_child else curr.yes_child

            if curr is None:
                break

        if curr is None:
            return {
                "diagnosis": "Undetermined Clinical State",
                "severity_score": 1,
                "triage_recommendation": "General Clinical Evaluation",
                "prescription_advice": "Consult Attending Physician.",
                "path": path,
            }

        return {
            "diagnosis": curr.question_or_diagnosis,
            "severity_score": curr.severity_score,
            "triage_recommendation": curr.triage_recommendation,
            "prescription_advice": curr.prescription_advice,
            "path": path,
        }

    def get_tree_structure(self) -> Dict[str, Any]:
        """Returns entire tree representation as nested dict."""
        return self.root.to_dict()
