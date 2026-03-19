import type { IntegratedResult, PatientInfo } from "./claim";

export type SavedRecord = {
  recordId: string;
  patientInfo: PatientInfo;
  results: IntegratedResult;
  savedAt: string;
  submissionStatus: "draft" | "submitted" | "approved" | "denied";
  submissionDate?: string;
  payerNotes?: string;
};

const RECORDS_STORAGE_KEY = "medicore_saved_records";
const SUBMISSIONS_STORAGE_KEY = "medicore_submissions";

export const getRecordsDB = (): SavedRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(RECORDS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveClaimRecord = (
  patientInfo: PatientInfo,
  results: IntegratedResult
): SavedRecord => {
  const recordId = `REC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const record: SavedRecord = {
    recordId,
    patientInfo,
    results,
    savedAt: new Date().toISOString(),
    submissionStatus: "draft",
  };

  if (typeof window !== "undefined") {
    const existing = getRecordsDB();
    const updated = [...existing, record];
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(updated));
  }

  return record;
};

export const getAllRecords = (): SavedRecord[] => {
  return getRecordsDB();
};

export const getRecordById = (recordId: string): SavedRecord | null => {
  const records = getRecordsDB();
  return records.find((r) => r.recordId === recordId) || null;
};

export const updateRecordStatus = (
  recordId: string,
  status: SavedRecord["submissionStatus"]
): SavedRecord | null => {
  if (typeof window === "undefined") return null;

  const records = getRecordsDB();
  const index = records.findIndex((r) => r.recordId === recordId);

  if (index === -1) return null;

  records[index] = {
    ...records[index],
    submissionStatus: status,
    submissionDate: new Date().toISOString(),
  };

  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  return records[index];
};

export const deleteRecord = (recordId: string): boolean => {
  if (typeof window === "undefined") return false;

  const records = getRecordsDB();
  const filtered = records.filter((r) => r.recordId !== recordId);

  if (filtered.length === records.length) return false; // Record not found

  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

// Submission tracking
export type ClaimSubmission = {
  submissionId: string;
  recordId: string;
  submittedAt: string;
  insuranceProvider: string;
  status: "pending" | "received" | "processing" | "approved" | "denied";
  trackingNumber?: string;
  estimatedProcessingDate?: string;
};

export const submitClaimToInsurance = (
  record: SavedRecord
): ClaimSubmission => {
  const submissionId = `SUB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

  const submission: ClaimSubmission = {
    submissionId,
    recordId: record.recordId,
    submittedAt: new Date().toISOString(),
    insuranceProvider: record.patientInfo.insuranceProvider,
    status: "received",
    trackingNumber,
    estimatedProcessingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (typeof window !== "undefined") {
    const existing = getSubmissions();
    const updated = [...existing, submission];
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));

    // Update record status
    updateRecordStatus(record.recordId, "submitted");
  }

  return submission;
};

export const getSubmissions = (): ClaimSubmission[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getSubmissionsByRecord = (recordId: string): ClaimSubmission[] => {
  return getSubmissions().filter((s) => s.recordId === recordId);
};

// Mock insurance validation & approval simulation
export const simulateInsuranceProcessing = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _submission: ClaimSubmission,
): { approved: boolean; message: string } => {
  // Simulate 30% approval rate for demo
  const approved = Math.random() > 0.3;

  if (approved) {
    return {
      approved: true,
      message: "Claim approved. Benefits have been processed and payment is being issued.",
    };
  } else {
    const reasons = [
      "Additional documentation required",
      "Procedure code requires pre-authorization",
      "Diagnosis code needs clarification",
      "Patient coverage verification pending",
    ];
    return {
      approved: false,
      message: `Claim requires review: ${reasons[Math.floor(Math.random() * reasons.length)]}`,
    };
  }
};
