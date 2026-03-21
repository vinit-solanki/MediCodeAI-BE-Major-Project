"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildClaimSummary, type IntegratedResult, type PatientInfo } from "@/lib/claim";

const API_BASE = "http://localhost:8000";

type ICDCode = { code: string; description: string; confidence: number };
type CPTCode = { code: string; description: string; linked_icd_codes: string[]; confidence: number };
type HCPCSCode = { code: string; description: string; linked_icd_codes: string[]; confidence: number };

type SectionJudgement = {
  section: string;
  verdict: "pass" | "fail";
  incorrect_codes: string[] | null;
  notes: string;
};

type ApiResponse = {
  extracted_entities: {
    icd_terms: string[];
    cpt_terms: string[];
    hcpcs_terms: string[];
  };
  icd_codes: { icd_codes: ICDCode[] };
  cpt_codes: { cpt_codes: CPTCode[] };
  hcpcs_codes: { hcpcs_codes: HCPCSCode[] };
  evaluation?: {
    overall_verdict: "pass" | "fail";
    overall_score: number;
    section_judgements: SectionJudgement[];
    compliance_risk: string;
    summary: string;
    incorrect_codes_overall: string[];
    notes: string;
  };
  trace_id?: string;
};

type ProcessingStage =
  | "idle"
  | "submitting"
  | "extracting"
  | "coding_icd"
  | "coding_cpt"
  | "coding_hcpcs"
  | "evaluating"
  | "done"
  | "error";

const STAGE_LABELS: Record<ProcessingStage, string> = {
  idle: "",
  submitting: "Submitting report...",
  extracting: "Extracting clinical entities...",
  coding_icd: "Generating ICD-10 codes...",
  coding_cpt: "Generating CPT codes...",
  coding_hcpcs: "Generating HCPCS codes...",
  evaluating: "Evaluating compliance...",
  done: "Complete",
  error: "Error",
};

const STAGES_ORDER: ProcessingStage[] = [
  "submitting",
  "extracting",
  "coding_icd",
  "coding_cpt",
  "coding_hcpcs",
  "evaluating",
  "done",
];

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 90
      ? "var(--color-background-success)"
      : pct >= 75
      ? "var(--color-background-warning)"
      : "var(--color-background-danger)";
  const text =
    pct >= 90
      ? "var(--color-text-success)"
      : pct >= 75
      ? "var(--color-text-warning)"
      : "var(--color-text-danger)";
  return (
    <span
      style={{
        background: color,
        color: text,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
      }}
    >
      {pct}%
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: "pass" | "fail" }) {
  const isPass = verdict === "pass";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: isPass
          ? "var(--color-background-success)"
          : "var(--color-background-danger)",
        color: isPass ? "var(--color-text-success)" : "var(--color-text-danger)",
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {isPass ? "PASS" : "FAIL"}
    </span>
  );
}

function CodeCard({
  code,
  description,
  confidence,
  linked,
  isIncorrect,
}: {
  code: string;
  description: string;
  confidence: number;
  linked?: string[];
  isIncorrect?: boolean;
}) {
  return (
    <div
      style={{
        border: isIncorrect
          ? "1px solid var(--color-border-danger)"
          : "0.5px solid var(--color-border-tertiary)",
        borderRadius: 10,
        padding: "12px 14px",
        background: isIncorrect
          ? "var(--color-background-danger)"
          : "var(--color-background-primary)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
      }}
    >
      {isIncorrect && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            fontSize: 11,
            color: "var(--color-text-danger)",
            fontWeight: 500,
          }}
        >
          Flagged
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-info)",
            background: "var(--color-background-info)",
            padding: "2px 8px",
            borderRadius: 5,
          }}
        >
          {code}
        </span>
        <ConfidencePill value={confidence} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "var(--color-text-primary)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {linked && linked.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
          {linked.map((l) => (
            <span
              key={l}
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-secondary)",
                background: "var(--color-background-secondary)",
                padding: "1px 6px",
                borderRadius: 4,
                border: "0.5px solid var(--color-border-tertiary)",
              }}
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineProgress({ stage }: { stage: ProcessingStage }) {
  const currentIndex = STAGES_ORDER.indexOf(stage);
  return (
    <div style={{ margin: "20px 0 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          position: "relative",
        }}
      >
        {STAGES_ORDER.filter((s) => s !== "done").map((s, i, arr) => {
          const stepIndex = STAGES_ORDER.indexOf(s);
          const isDone = currentIndex > stepIndex;
          const isActive = currentIndex === stepIndex;
          const isLast = i === arr.length - 1;
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                flex: isLast ? "0 0 auto" : 1,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isDone
                    ? "var(--color-background-success)"
                    : isActive
                    ? "var(--color-background-info)"
                    : "var(--color-background-secondary)",
                  border: isDone
                    ? "1.5px solid var(--color-border-success)"
                    : isActive
                    ? "1.5px solid var(--color-border-info)"
                    : "0.5px solid var(--color-border-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                }}
              >
                {isDone ? (
                  <span style={{ fontSize: 11, color: "var(--color-text-success)" }}>OK</span>
                ) : isActive ? (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--color-text-info)",
                      animation: "pulse 1s ease-in-out infinite",
                    }}
                  />
                ) : null}
              </div>
              {!isLast && (
                <div
                  style={{
                    flex: 1,
                    height: 1.5,
                    background: isDone
                      ? "var(--color-border-success)"
                      : "var(--color-border-tertiary)",
                    margin: "0 2px",
                    transition: "background 0.3s ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 12,
          color: "var(--color-text-secondary)",
          textAlign: "center",
        }}
      >
        {STAGE_LABELS[stage]}
      </p>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }`}</style>
    </div>
  );
}

export default function HospitalDashboard() {
  const router = useRouter();
  const [reportText, setReportText] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [includeEvaluation, setIncludeEvaluation] = useState(true);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [integratedResult, setIntegratedResult] = useState<IntegratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"icd" | "cpt" | "hcpcs" | "eval">("icd");

  const toComplianceScore = (risk: string | undefined): number | null => {
    if (!risk) return null;
    const normalized = risk.toLowerCase();
    if (normalized === "low") return 0.08;
    if (normalized === "medium") return 0.15;
    if (normalized === "high") return 0.3;
    return null;
  };

  const toIntegratedResult = (data: ApiResponse): IntegratedResult => {
    const medicalCodes = {
      icd10: data.icd_codes.icd_codes.map((item) => item.code),
      cpt: data.cpt_codes.cpt_codes.map((item) => item.code),
      hcpcs: data.hcpcs_codes.hcpcs_codes.map((item) => item.code),
    };

    const descriptionByCode: Record<string, string> = {};
    data.icd_codes.icd_codes.forEach((item) => {
      descriptionByCode[item.code] = item.description;
    });
    data.cpt_codes.cpt_codes.forEach((item) => {
      descriptionByCode[item.code] = item.description;
    });
    data.hcpcs_codes.hcpcs_codes.forEach((item) => {
      descriptionByCode[item.code] = item.description;
    });

    const aiConfidence = {
      overall: typeof data.evaluation?.overall_score === "number" ? data.evaluation.overall_score : null,
      compliance: toComplianceScore(data.evaluation?.compliance_risk),
    };

    return {
      extractedData: {
        diagnosis: data.extracted_entities.icd_terms.join(", ") || "Not provided",
        procedures: data.extracted_entities.cpt_terms.join(", ") || "Not provided",
        medications: data.extracted_entities.hcpcs_terms.join(", ") || "Not provided",
        physician: "Not provided",
      },
      medicalCodes,
      aiConfidence,
      traceId: data.trace_id ?? null,
      evaluation: data.evaluation ?? null,
      backendResponse: data,
      claimSummary: buildClaimSummary(medicalCodes, aiConfidence, descriptionByCode),
    };
  };

  const simulateStages = async () => {
    const stages: ProcessingStage[] = [
      "submitting",
      "extracting",
      "coding_icd",
      "coding_cpt",
      "coding_hcpcs",
      ...(includeEvaluation ? (["evaluating"] as ProcessingStage[]) : []),
    ];
    for (const s of stages) {
      setStage(s);
      await new Promise((r) => setTimeout(r, 600));
    }
  };

  const handleSubmit = async () => {
    if (!reportText.trim()) return;
    setError(null);
    setResult(null);
    setIntegratedResult(null);
    setActiveTab("icd");

    const stagePromise = simulateStages();

    try {
      const res = await fetch(`${API_BASE}/api/v1/coding/process/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medical_report_text: reportText,
          include_evaluation: includeEvaluation,
        }),
      });

      await stagePromise;

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail || `Server error: ${res.status}`);
      }

      const data: ApiResponse = await res.json();
      const normalized = toIntegratedResult(data);
      const patientInfo: PatientInfo = {
        patientId: patientId.trim() || "UNKNOWN",
        patientName: patientName.trim() || "Unknown Patient",
        dateOfService: "",
        insuranceProvider: "",
        notes: "",
      };

      sessionStorage.setItem(
        "hospital-results",
        JSON.stringify({
          patientInfo,
          reportText,
          results: normalized,
        }),
      );

      setIntegratedResult(normalized);
      setResult(data);
      setStage("done");
    } catch (err: unknown) {
      await stagePromise.catch(() => {});
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
      setStage("error");
    }
  };

  const handleReset = () => {
    setStage("idle");
    setResult(null);
    setIntegratedResult(null);
    setError(null);
    setReportText("");
    setPatientName("");
    setPatientId("");
  };

  const openHospitalResults = () => {
    if (!integratedResult) return;
    router.push("/hospital-results");
  };

  const openPatientDashboard = () => {
    if (!integratedResult) return;

    const patientInfo: PatientInfo = {
      patientId: patientId.trim() || "UNKNOWN",
      patientName: patientName.trim() || "Unknown Patient",
      dateOfService: "",
      insuranceProvider: "",
      notes: "",
    };

    sessionStorage.setItem(
      "patient-view",
      JSON.stringify({ patientInfo, results: integratedResult }),
    );
    router.push("/patient-dashboard");
  };

  const isProcessing =
    stage !== "idle" && stage !== "done" && stage !== "error";

  const incorrectCodes = result?.evaluation?.incorrect_codes_overall ?? [];

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        color: "var(--color-text-primary)",
        minHeight: "100vh",
        background: "var(--color-background-tertiary)",
      }}
    >
      <div
        style={{
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          background: "var(--color-background-primary)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--color-background-info)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: "var(--color-text-info)",
            }}
          >
            MC
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>
              MediCode AI
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--color-text-secondary)",
              }}
            >
              Medical Coding Pipeline
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-secondary)",
              padding: "3px 8px",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 5,
              fontFamily: "var(--font-mono)",
            }}
          >
            POST /api/v1/coding/process/text
          </span>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 24px",
          display: "grid",
          gridTemplateColumns: result ? "1fr 1.4fr" : "1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 12,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 500, fontSize: 15 }}>
              New Coding Request
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
              Submit a medical report to extract ICD-10, CPT, and HCPCS codes
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  display: "block",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Patient name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. John Smith"
                disabled={isProcessing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  fontSize: 13,
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: 7,
                  background: "var(--color-background-primary)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  display: "block",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Patient ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="e.g. PT-00421"
                disabled={isProcessing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  fontSize: 13,
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: 7,
                  background: "var(--color-background-primary)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                display: "block",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Medical report text <span style={{ color: "var(--color-text-danger)" }}>*</span>
            </label>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Paste the full clinical note here - subjective, objective, assessment, and plan..."
              disabled={isProcessing}
              rows={14}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.65,
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: 8,
                background: "var(--color-background-primary)",
                color: "var(--color-text-primary)",
                resize: "vertical",
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                color: "var(--color-text-tertiary)",
                textAlign: "right",
              }}
            >
              {reportText.length} characters
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "var(--color-background-secondary)",
              borderRadius: 8,
              border: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                Include compliance evaluation
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-secondary)" }}>
                AI audits generated codes for accuracy and compliance risk
              </p>
            </div>
            <button
              onClick={() => setIncludeEvaluation(!includeEvaluation)}
              disabled={isProcessing}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                border: "none",
                background: includeEvaluation
                  ? "var(--color-background-success)"
                  : "var(--color-background-secondary)",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s",
                outline: "0.5px solid var(--color-border-secondary)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: includeEvaluation
                    ? "var(--color-text-success)"
                    : "var(--color-text-tertiary)",
                  top: 3,
                  left: includeEvaluation ? 21 : 3,
                  transition: "left 0.2s, background 0.2s",
                }}
              />
            </button>
          </div>

          {stage !== "idle" && <PipelineProgress stage={stage} />}

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--color-background-danger)",
                border: "0.5px solid var(--color-border-danger)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--color-text-danger)",
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !reportText.trim()}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "none",
                background:
                  isProcessing || !reportText.trim()
                    ? "var(--color-background-secondary)"
                    : "var(--color-text-primary)",
                color:
                  isProcessing || !reportText.trim()
                    ? "var(--color-text-tertiary)"
                    : "var(--color-background-primary)",
                fontWeight: 500,
                fontSize: 14,
                cursor:
                  isProcessing || !reportText.trim()
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
              }}
            >
              {isProcessing ? "Processing..." : "Run coding pipeline"}
            </button>
            {(result || error) && (
              <button
                onClick={handleReset}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            )}
            {integratedResult && (
              <>
                <button
                  onClick={openHospitalResults}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "0.5px solid var(--color-border-secondary)",
                    background: "var(--color-background-primary)",
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Hospital Results
                </button>
                <button
                  onClick={openPatientDashboard}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "0.5px solid var(--color-border-secondary)",
                    background: "var(--color-background-primary)",
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Patient Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {result && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12,
                padding: "14px 20px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 12,
                }}
              >
                {[
                  {
                    label: "ICD-10 codes",
                    value: result.icd_codes.icd_codes.length,
                    color: "var(--color-text-info)",
                    bg: "var(--color-background-info)",
                  },
                  {
                    label: "CPT codes",
                    value: result.cpt_codes.cpt_codes.length,
                    color: "var(--color-text-warning)",
                    bg: "var(--color-background-warning)",
                  },
                  {
                    label: "HCPCS codes",
                    value: result.hcpcs_codes.hcpcs_codes.length,
                    color: "var(--color-text-secondary)",
                    bg: "var(--color-background-secondary)",
                  },
                  ...(result.evaluation
                    ? [
                        {
                          label: "Compliance score",
                          value: `${Math.round(result.evaluation.overall_score * 100)}%`,
                          color:
                            result.evaluation.overall_verdict === "pass"
                              ? "var(--color-text-success)"
                              : "var(--color-text-danger)",
                          bg:
                            result.evaluation.overall_verdict === "pass"
                              ? "var(--color-background-success)"
                              : "var(--color-background-danger)",
                        },
                      ]
                    : []),
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      background: m.bg,
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {m.label}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 22,
                        fontWeight: 500,
                        color: m.color,
                      }}
                    >
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {(patientName || patientId) && (
              <div
                style={{
                  padding: "10px 16px",
                  background: "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 8,
                  fontSize: 13,
                  display: "flex",
                  gap: 16,
                  color: "var(--color-text-secondary)",
                }}
              >
                {patientName && (
                  <span>
                    Patient: <strong style={{ color: "var(--color-text-primary)" }}>{patientName}</strong>
                  </span>
                )}
                {patientId && (
                  <span>
                    ID: <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{patientId}</span>
                  </span>
                )}
              </div>
            )}

            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: "0.5px solid var(--color-border-tertiary)",
                }}
              >
                {(
                  [
                    { key: "icd", label: "ICD-10", count: result.icd_codes.icd_codes.length },
                    { key: "cpt", label: "CPT", count: result.cpt_codes.cpt_codes.length },
                    { key: "hcpcs", label: "HCPCS", count: result.hcpcs_codes.hcpcs_codes.length },
                    ...(result.evaluation ? [{ key: "eval", label: "Evaluation", count: null }] : []),
                  ] as { key: string; label: string; count: number | null }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    style={{
                      padding: "11px 18px",
                      border: "none",
                      borderBottom:
                        activeTab === tab.key
                          ? "2px solid var(--color-text-primary)"
                          : "2px solid transparent",
                      background: "transparent",
                      color:
                        activeTab === tab.key
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                      fontWeight: activeTab === tab.key ? 500 : 400,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "var(--color-background-secondary)",
                          color: "var(--color-text-secondary)",
                          padding: "1px 6px",
                          borderRadius: 10,
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                    {tab.key === "eval" && result.evaluation && (
                      <VerdictBadge verdict={result.evaluation.overall_verdict} />
                    )}
                  </button>
                ))}
              </div>

              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {activeTab === "icd" && (
                  <>
                    {result.icd_codes.icd_codes.length === 0 ? (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: 0 }}>
                        No ICD-10 codes generated.
                      </p>
                    ) : (
                      result.icd_codes.icd_codes.map((c) => (
                        <CodeCard
                          key={c.code}
                          code={c.code}
                          description={c.description}
                          confidence={c.confidence}
                          isIncorrect={incorrectCodes.includes(c.code)}
                        />
                      ))
                    )}
                  </>
                )}

                {activeTab === "cpt" && (
                  <>
                    {result.cpt_codes.cpt_codes.length === 0 ? (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: 0 }}>
                        No CPT codes generated.
                      </p>
                    ) : (
                      result.cpt_codes.cpt_codes.map((c) => (
                        <CodeCard
                          key={c.code}
                          code={c.code}
                          description={c.description}
                          confidence={c.confidence}
                          linked={c.linked_icd_codes}
                          isIncorrect={incorrectCodes.includes(c.code)}
                        />
                      ))
                    )}
                  </>
                )}

                {activeTab === "hcpcs" && (
                  <>
                    {result.hcpcs_codes.hcpcs_codes.length === 0 ? (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: 0 }}>
                        No HCPCS codes generated.
                      </p>
                    ) : (
                      result.hcpcs_codes.hcpcs_codes.map((c) => (
                        <CodeCard
                          key={c.code}
                          code={c.code}
                          description={c.description}
                          confidence={c.confidence}
                          linked={c.linked_icd_codes}
                          isIncorrect={incorrectCodes.includes(c.code)}
                        />
                      ))
                    )}
                  </>
                )}

                {activeTab === "eval" && result.evaluation && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "var(--color-background-secondary)",
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                          Overall verdict
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-secondary)" }}>
                          Compliance risk:{" "}
                          <span
                            style={{
                              textTransform: "capitalize",
                              color:
                                result.evaluation.compliance_risk === "low"
                                  ? "var(--color-text-success)"
                                  : result.evaluation.compliance_risk === "medium"
                                  ? "var(--color-text-warning)"
                                  : "var(--color-text-danger)",
                            }}
                          >
                            {result.evaluation.compliance_risk}
                          </span>
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20, fontWeight: 500 }}>
                          {Math.round(result.evaluation.overall_score * 100)}%
                        </span>
                        <VerdictBadge verdict={result.evaluation.overall_verdict} />
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        border: "0.5px solid var(--color-border-tertiary)",
                        borderRadius: 8,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {result.evaluation.summary}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {result.evaluation.section_judgements.map((j) => (
                        <div
                          key={j.section}
                          style={{
                            border: "0.5px solid var(--color-border-tertiary)",
                            borderRadius: 8,
                            padding: "12px 14px",
                            background: "var(--color-background-primary)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {j.section} codes
                            </span>
                            <VerdictBadge verdict={j.verdict} />
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
                            {j.notes}
                          </p>
                          {j.incorrect_codes && j.incorrect_codes.length > 0 && (
                            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {j.incorrect_codes.map((c) => (
                                <span
                                  key={c}
                                  style={{
                                    fontSize: 11,
                                    fontFamily: "var(--font-mono)",
                                    color: "var(--color-text-danger)",
                                    background: "var(--color-background-danger)",
                                    padding: "2px 8px",
                                    borderRadius: 5,
                                    border: "0.5px solid var(--color-border-danger)",
                                  }}
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        background: "var(--color-background-warning)",
                        border: "0.5px solid var(--color-border-warning)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--color-text-warning)",
                        lineHeight: 1.55,
                      }}
                    >
                      <strong>Recommended action:</strong> {result.evaluation.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12,
                padding: "14px 20px",
              }}
            >
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Extracted entities
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(
                  [
                    { label: "ICD terms", items: result.extracted_entities.icd_terms },
                    { label: "CPT terms", items: result.extracted_entities.cpt_terms },
                    { label: "HCPCS terms", items: result.extracted_entities.hcpcs_terms },
                  ] as { label: string; items: string[] }[]
                ).map((group) => (
                  <div key={group.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        flexShrink: 0,
                        paddingTop: 2,
                        minWidth: 70,
                      }}
                    >
                      {group.label}
                    </span>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {group.items.map((item) => (
                        <span
                          key={item}
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 5,
                            background: "var(--color-background-secondary)",
                            color: "var(--color-text-primary)",
                            border: "0.5px solid var(--color-border-tertiary)",
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
