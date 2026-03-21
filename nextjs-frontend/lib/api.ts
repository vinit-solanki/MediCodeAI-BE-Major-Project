import { buildClaimSummary, fallbackIntegratedResult } from "@/lib/claim";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

type HealthResponse = {
  status: string;
  version: string;
  environment: string;
};

type ProcessTextRequest = {
  medical_report_text: string;
  include_evaluation?: boolean;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readNestedCodes = (value: unknown): string[] => {
  if (!value) return [];

  if (typeof value === "string") {
    return [value.trim()].filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap(readNestedCodes);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const directKeys = ["code", "icd_code", "ICD_code", "cpt_code", "hcpcs_code"];

    const direct = directKeys
      .map((key) => obj[key])
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);

    const deep = Object.values(obj).flatMap(readNestedCodes);
    return [...direct, ...deep];
  }

  return [];
};

type CodeEntry = {
  code: string;
  description?: string;
};

const readCodeEntries = (value: unknown): CodeEntry[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(readCodeEntries);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const codeKeys = ["code", "icd_code", "ICD_code", "cpt_code", "hcpcs_code"];
    const descriptionKeys = ["description", "desc", "label", "title"];

    const code = codeKeys
      .map((key) => obj[key])
      .find((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);

    const description = descriptionKeys
      .map((key) => obj[key])
      .find((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);

    const nested = Object.values(obj).flatMap(readCodeEntries);
    return code ? [{ code, description }, ...nested] : nested;
  }

  return [];
};

const toCommaText = (value: unknown, fallback: string): string => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const joined = value.filter((entry) => typeof entry === "string").join(", ");
    return joined || fallback;
  }
  if (typeof value === "object") {
    const parts = Object.values(value as Record<string, unknown>)
      .flatMap((entry) => (typeof entry === "string" ? [entry] : []))
      .join(", ");
    return parts || fallback;
  }
  return fallback;
};

const normalizeErrorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message) return err.message;
  return "Network error while calling the API.";
};

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const detail = (body as Record<string, unknown> | null)?.detail;
    const message = typeof detail === "string" ? detail : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export async function healthCheck(): Promise<HealthResponse> {
  if (USE_MOCK) {
    await wait(280);
    return { status: "healthy", version: "0.1.0", environment: "demo" };
  }

  const res = await fetch(`${API_BASE}/api/v1/health`, { method: "GET" });
  return handleResponse<HealthResponse>(res);
}

export async function processMedicalText(request: ProcessTextRequest) {
  if (!request.medical_report_text || request.medical_report_text.trim().length < 10) {
    throw new Error("Medical report text must be at least 10 characters long.");
  }

  if (USE_MOCK) {
    await wait(600);
    return fallbackIntegratedResult();
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/v1/coding/process/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medical_report_text: request.medical_report_text,
        include_evaluation: request.include_evaluation ?? true,
      }),
    });
  } catch (error: unknown) {
    throw new Error(
      normalizeErrorMessage(error).includes("fetch")
        ? "Cannot reach backend API. Start backend or set NEXT_PUBLIC_API_URL correctly."
        : normalizeErrorMessage(error),
    );
  }

  const payload = await handleResponse<Record<string, unknown>>(response);

  const extracted = (payload.extracted_entities as Record<string, unknown> | undefined) || {};
  const icdEntries = readCodeEntries(payload.icd_codes);
  const cptEntries = readCodeEntries(payload.cpt_codes);
  const hcpcsEntries = readCodeEntries(payload.hcpcs_codes);

  const descriptionByCode: Record<string, string> = {};
  [...icdEntries, ...cptEntries, ...hcpcsEntries].forEach((entry) => {
    if (entry.code && entry.description) {
      descriptionByCode[entry.code] = entry.description;
    }
  });

  const medicalCodes = {
    icd10: Array.from(new Set(icdEntries.map((entry) => entry.code).concat(readNestedCodes(payload.icd_codes)))),
    cpt: Array.from(new Set(cptEntries.map((entry) => entry.code).concat(readNestedCodes(payload.cpt_codes)))),
    hcpcs: Array.from(new Set(hcpcsEntries.map((entry) => entry.code).concat(readNestedCodes(payload.hcpcs_codes)))),
  };

  const evaluation = payload.evaluation as Record<string, unknown> | undefined;
  const overall = evaluation?.overall_score;
  const compliance = evaluation?.compliance_risk;

  const aiConfidence = {
    overall: typeof overall === "number" ? overall : null,
    compliance: typeof compliance === "number" ? compliance : null,
  };

  return {
    extractedData: {
      diagnosis: toCommaText(extracted.diagnoses ?? extracted.conditions, "Not provided"),
      procedures: toCommaText(extracted.procedures ?? extracted.treatments, "Not provided"),
      medications: toCommaText(extracted.medications, "Not provided"),
      physician: toCommaText(extracted.provider ?? extracted.physician, "Unknown"),
    },
    medicalCodes,
    aiConfidence,
    traceId: typeof payload.trace_id === "string" ? payload.trace_id : null,
    evaluation: (payload.evaluation as Record<string, unknown> | undefined) ?? null,
    backendResponse: payload,
    claimSummary: buildClaimSummary(medicalCodes, aiConfidence, descriptionByCode),
  };
}

export { API_BASE, USE_MOCK };
