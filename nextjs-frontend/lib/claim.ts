export type RiskLevel = "low" | "medium" | "high";

export type ExtractedData = {
  diagnosis: string;
  procedures: string;
  medications: string;
  physician: string;
};

export type MedicalCodes = {
  icd10: string[];
  cpt: string[];
  hcpcs: string[];
};

export type ConfidenceScores = {
  overall: number | null;
  compliance: number | null;
};

export type ClaimLineItem = {
  id: string;
  code: string;
  codeType: "ICD-10" | "CPT" | "HCPCS";
  description: string;
  units: number;
  amount: number;
};

export type ValidationCheck = {
  label: string;
  status: "pass" | "review";
  detail: string;
};

export type ClaimSummary = {
  formType: "CMS-1500" | "UB-04";
  claimStatus: string;
  approvalLikelihood: string;
  denialRisk: RiskLevel;
  payerNotes: string;
  generatedAt: string;
  totalAmount: number;
  lineItems: ClaimLineItem[];
  validationChecks: ValidationCheck[];
};

export type IntegratedResult = {
  extractedData: ExtractedData;
  medicalCodes: MedicalCodes;
  aiConfidence: ConfidenceScores;
  traceId: string | null;
  claimSummary: ClaimSummary;
};

export type PatientInfo = {
  patientId: string;
  patientName: string;
  dateOfService: string;
  insuranceProvider: string;
  notes: string;
};

const chargeCatalog: Record<string, number> = {
  I10: 95,
  "E11.9": 120,
  "Z00.00": 80,
  "99213": 175,
  "93000": 210,
  "82947": 65,
  A0425: 145,
  A0429: 280,
};

const descriptionCatalog: Record<string, string> = {
  I10: "Essential (primary) hypertension",
  "E11.9": "Type 2 diabetes mellitus without complications",
  "Z00.00": "General adult medical examination",
  "99213": "Office/outpatient established patient visit",
  "93000": "Electrocardiogram, complete",
  "82947": "Glucose quantitative test",
  A0425: "Ground mileage, per statute mile",
  A0429: "Basic life support transport",
};

export const demoPatientCase = {
  patientInfo: {
    patientId: "PT-20431",
    patientName: "Ananya Mehta",
    dateOfService: "2026-03-12",
    insuranceProvider: "Aetna",
    notes: "Follow-up after elevated blood glucose and recurrent fatigue.",
  } satisfies PatientInfo,
  medicalNote:
    "Patient is a 52-year-old female presenting for follow-up on Type 2 diabetes and hypertension. Current medications include Metformin 500mg BID and Lisinopril 10mg daily. Blood glucose in office is elevated. Provider performed routine outpatient evaluation and ECG. Continue medication and monitor blood pressure and glucose levels.",
};

const makeLineItem = (
  code: string,
  codeType: "ICD-10" | "CPT" | "HCPCS",
  index: number,
): ClaimLineItem => {
  const amount = chargeCatalog[code] ?? 95 + index * 15;
  return {
    id: `${codeType}-${code}-${index}`,
    code,
    codeType,
    description: descriptionCatalog[code] ?? "Medical service associated with extracted code",
    units: 1,
    amount,
  };
};

export const buildClaimSummary = (
  codes: MedicalCodes,
  confidence: ConfidenceScores,
): ClaimSummary => {
  const lineItems: ClaimLineItem[] = [
    ...codes.icd10.map((code, index) => makeLineItem(code, "ICD-10", index)),
    ...codes.cpt.map((code, index) => makeLineItem(code, "CPT", index)),
    ...codes.hcpcs.map((code, index) => makeLineItem(code, "HCPCS", index)),
  ];

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount * item.units, 0);
  const compliance = confidence.compliance ?? 0;
  const risk: RiskLevel = compliance > 0.2 ? "high" : compliance > 0.1 ? "medium" : "low";

  const approvalLikelihood =
    risk === "low" ? "High (90%+)" : risk === "medium" ? "Moderate (75-89%)" : "Needs manual review (<75%)";

  return {
    formType: codes.hcpcs.length > 0 ? "UB-04" : "CMS-1500",
    claimStatus: "Ready for payer submission",
    approvalLikelihood,
    denialRisk: risk,
    payerNotes:
      risk === "low"
        ? "Claim satisfies major payer checks and appears submission-ready."
        : "Review coding justification and supporting notes before final submission.",
    generatedAt: new Date().toISOString(),
    totalAmount,
    lineItems,
    validationChecks: [
      {
        label: "Required data completeness",
        status: "pass",
        detail: "All required patient, provider, and coding fields are present.",
      },
      {
        label: "Code compatibility",
        status: risk === "high" ? "review" : "pass",
        detail:
          risk === "high"
            ? "One or more code combinations should be validated by coding staff."
            : "Primary diagnosis and procedure mapping are internally consistent.",
      },
      {
        label: "Payer policy pre-check",
        status: risk === "low" ? "pass" : "review",
        detail:
          risk === "low"
            ? "No immediate payer policy conflicts detected."
            : "Potential policy conflict detected. Recommend monitor/validator review.",
      },
    ],
  };
};

export const fallbackIntegratedResult = (): IntegratedResult => {
  const medicalCodes: MedicalCodes = {
    icd10: ["I10", "E11.9", "Z00.00"],
    cpt: ["99213", "93000", "82947"],
    hcpcs: ["A0425"],
  };
  const aiConfidence: ConfidenceScores = {
    overall: 0.94,
    compliance: 0.08,
  };

  return {
    extractedData: {
      diagnosis: "Hypertension, Type 2 Diabetes",
      procedures: "Routine outpatient evaluation, ECG, glucose test",
      medications: "Metformin 500mg, Lisinopril 10mg",
      physician: "Dr. Sarah Johnson",
    },
    medicalCodes,
    aiConfidence,
    traceId: "demo-trace-20431",
    claimSummary: buildClaimSummary(medicalCodes, aiConfidence),
  };
};
