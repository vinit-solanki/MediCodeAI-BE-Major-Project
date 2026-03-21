import type { PatientInfo, IntegratedResult } from "./claim";
import type { SavedRecord, ClaimSubmission } from "./records-manager";

export interface PatientClaim {
  recordId: string;
  patientInfo: PatientInfo;
  results: IntegratedResult;
  savedAt: string;
  submission?: ClaimSubmission;
  submissionStatus: "draft" | "submitted" | "approved" | "denied";
  submissionDate?: string;
  trackingNumber?: string;
  estimatedProcessingDate?: string;
  payerNotes?: string;
  denialReason?: string;
}

export interface ClaimsStats {
  totalClaims: number;
  submittedClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  totalBilled: number;
  totalApproved: number;
}

/**
 * Get all claims for a specific patient from localStorage
 */
export function getPatientClaims(patientId: string): PatientClaim[] {
  if (typeof window === "undefined") return [];

  try {
    const recordsJson = localStorage.getItem("MediCode_saved_records");
    const submissionsJson = localStorage.getItem("MediCode_submissions");

    const records: SavedRecord[] = recordsJson ? JSON.parse(recordsJson) : [];
    const submissions: ClaimSubmission[] = submissionsJson ? JSON.parse(submissionsJson) : [];

    return records
      .filter((record) => record.patientInfo.patientId === patientId)
      .map((record) => {
        const submission = submissions.find((sub) => sub.recordId === record.recordId);
        return {
          recordId: record.recordId,
          patientInfo: record.patientInfo,
          results: record.results,
          savedAt: record.savedAt,
          submission,
          submissionStatus: record.submissionStatus,
          submissionDate: record.submissionDate,
          trackingNumber: submission?.trackingNumber,
          estimatedProcessingDate: submission?.estimatedProcessingDate,
          payerNotes: record.payerNotes,
          denialReason:
            record.submissionStatus === "denied" && record.payerNotes
              ? extractDenialReason(record.payerNotes)
              : undefined,
        };
      })
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    console.error("Failed to get patient claims", error);
    return [];
  }
}

/**
 * Get the most recent claim for a patient
 */
export function getMostRecentClaim(patientId: string): PatientClaim | null {
  const claims = getPatientClaims(patientId);
  return claims.length > 0 ? claims[0] : null;
}

/**
 * Get statistics for a patient's claims
 */
export function getPatientClaimsStats(patientId: string): ClaimsStats {
  const claims = getPatientClaims(patientId);

  const stats: ClaimsStats = {
    totalClaims: claims.length,
    submittedClaims: claims.filter((c) => c.submissionStatus === "submitted").length,
    approvedClaims: claims.filter((c) => c.submissionStatus === "approved").length,
    deniedClaims: claims.filter((c) => c.submissionStatus === "denied").length,
    totalBilled: 0,
    totalApproved: 0,
  };

  claims.forEach((claim) => {
    const amount = claim.results.claimSummary.totalAmount;
    stats.totalBilled += amount;
    if (claim.submissionStatus === "approved") {
      stats.totalApproved += amount * 0.7; // Approximate coverage
    }
  });

  return stats;
}

/**
 * Get claim status timeline steps
 */
export function getClaimStatusTimeline(
  claim: PatientClaim,
): Array<{
  step: string;
  completed: boolean;
  timestamp?: string;
  details?: string;
}> {
  const steps: Array<{
    step: string;
    completed: boolean;
    timestamp?: string;
    details?: string;
  }> = [
    { step: "Medical record received", completed: true, timestamp: claim.savedAt },
    { step: "AI coding complete", completed: true, timestamp: claim.savedAt },
    { step: "Claim generated", completed: true, timestamp: claim.savedAt },
    {
      step: "Submitted to payer review",
      completed: claim.submissionStatus !== "draft",
      timestamp: claim.submissionDate,
    },
    {
      step: "Pending adjudication",
      completed: claim.submissionStatus === "submitted",
      timestamp:
        claim.submissionStatus === "submitted"
          ? new Date().toISOString()
          : claim.submissionStatus === "approved" || claim.submissionStatus === "denied"
            ? claim.submissionDate
            : undefined,
    },
  ];

  if (claim.submissionStatus === "approved") {
    steps.push({
      step: "Claim approved",
      completed: true,
      timestamp: claim.submissionDate,
      details: `Approved by ${claim.patientInfo.insuranceProvider}`,
    });
  } else if (claim.submissionStatus === "denied") {
    steps.push({
      step: "Claim denied",
      completed: true,
      timestamp: claim.submissionDate,
      details: claim.denialReason || "See payer notes for details",
    });
  }

  return steps;
}

/**
 * Extract denial reason from payer notes
 */
function extractDenialReason(payerNotes: string): string {
  const reasons = [
    "Duplicate claim",
    "Missing authorization",
    "Out of network provider",
    "Code not covered",
    "Exceeds frequency limit",
  ];

  for (const reason of reasons) {
    if (payerNotes.toLowerCase().includes(reason.toLowerCase())) {
      return reason;
    }
  }

  return "See details below";
}

/**
 * Calculate days until claim processing is complete
 */
export function getDaysUntilProcessing(claim: PatientClaim): number {
  if (!claim.estimatedProcessingDate) return 0;
  const now = new Date();
  const processing = new Date(claim.estimatedProcessingDate);
  const days = Math.ceil((processing.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Get claim status color
 */
export function getClaimStatusColor(
  status: "draft" | "submitted" | "approved" | "denied",
): string {
  switch (status) {
    case "draft":
      return "bg-gray-50 text-gray-700 border-gray-200";
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "approved":
      return "bg-green-50 text-green-700 border-green-200";
    case "denied":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

/**
 * Get claim status label
 */
export function getClaimStatusLabel(status: "draft" | "submitted" | "approved" | "denied"): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "In Progress";
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    default:
      return "Unknown";
  }
}

/**
 * Format timestamp to readable date
 */
export function formatClaimDate(timestamp: string | undefined): string {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
