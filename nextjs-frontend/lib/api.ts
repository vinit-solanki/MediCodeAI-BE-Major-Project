const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

const mockPdfResponse = {
  medical_entities: {
    diagnoses: ["Hypertension", "Type 2 Diabetes"],
    procedures: ["Routine checkup", "Blood pressure monitoring", "Glucose test"],
    medications: ["Metformin 500mg", "Lisinopril 10mg"],
    provider: "Dr. Sarah Johnson",
  },
  icd_codes: ["I10", "E11.9", "Z00.00"],
  cpt_codes: ["99213", "93000", "82947"],
  hcpcs_codes: ["A0425"],
  evaluation: { overall_score: 0.94, compliance_risk: 0.08 },
  trace_id: "mock-trace-id-1234",
};

const mockTextResponse = {
  ...mockPdfResponse,
};

async function maybeDelay(result: any) {
  // Light delay to mimic network for better UX feedback.
  await new Promise((resolve) => setTimeout(resolve, 400));
  return result;
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = (body as Record<string, unknown>)?.message as string;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (body && typeof body === "object" && "status" in body && (body as Record<string, unknown>).status !== "success") {
    const message = (body as Record<string, unknown>)?.message as string;
    throw new Error(message || "Request failed");
  }

  // prefer data envelope if present
  if (body && typeof body === "object" && "data" in body) {
    return (body as Record<string, unknown>).data;
  }

  return body ?? null;
}

export async function codePdf(file: File) {
  if (!file) {
    throw new Error("A file is required for PDF processing");
  }

  if (USE_MOCK) {
    return maybeDelay(mockPdfResponse);
  }

  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/code/pdf`, {
      method: "POST",
      body: formData,
    });
  } catch (err: any) {
    // Network/connection errors surface as TypeError in fetch.
    throw new Error(
      err?.message?.includes("fetch") || err?.name === "TypeError"
        ? "Cannot reach the MediCore backend. Please start the backend or check NEXT_PUBLIC_API_URL."
        : err?.message || "Network error while calling the API."
    );
  }

  return handleResponse(res);
}

export async function codeText(text: string) {
  if (!text || !text.trim()) {
    throw new Error("Medical text is required");
  }

  if (USE_MOCK) {
    return maybeDelay(mockTextResponse);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/code/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err: any) {
    throw new Error(
      err?.message?.includes("fetch") || err?.name === "TypeError"
        ? "Cannot reach the MediCore backend. Please start the backend or check NEXT_PUBLIC_API_URL."
        : err?.message || "Network error while calling the API."
    );
  }

  return handleResponse(res);
}

export { API_BASE };
