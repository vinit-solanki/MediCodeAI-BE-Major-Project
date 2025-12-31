// Lightweight API client for backend integration
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = body?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (body?.status && body.status !== "success") {
    throw new Error(body?.message || "Request failed");
  }

  return body?.data ?? body;
}

export async function codePdf(file) {
  if (!file) {
    throw new Error("A file is required for PDF processing");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/code/pdf`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(res);
}

export async function codeText(text) {
  if (!text || !text.trim()) {
    throw new Error("Medical text is required");
  }

  const res = await fetch(`${API_BASE}/api/code/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return handleResponse(res);
}

export { API_BASE };
