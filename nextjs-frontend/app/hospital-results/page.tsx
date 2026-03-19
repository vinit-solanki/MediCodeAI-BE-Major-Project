"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, Download, Home, ShieldCheck, Save, Send, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { fallbackIntegratedResult, type IntegratedResult, type PatientInfo } from "@/lib/claim";
import { downloadClaimPDF } from "@/lib/pdf-generator";
import { saveClaimRecord, submitClaimToInsurance, simulateInsuranceProcessing, updateRecordStatus } from "@/lib/records-manager";

const defaultPatient: PatientInfo = {
  patientId: "P-12345",
  patientName: "John Doe",
  dateOfService: "2026-03-15",
  insuranceProvider: "Aetna",
  notes: "Follow-up required",
};

const HospitalResultsPage = () => {
  const router = useRouter();

  const [initialData] = useState(() => {
    if (typeof window === "undefined") {
      return { patientInfo: defaultPatient, results: fallbackIntegratedResult() };
    }

    const raw = sessionStorage.getItem("hospital-results");
    if (!raw) {
      return { patientInfo: defaultPatient, results: fallbackIntegratedResult() };
    }

    try {
      const parsed = JSON.parse(raw) as { patientInfo: PatientInfo; results: IntegratedResult };
      return {
        patientInfo: parsed?.patientInfo ?? defaultPatient,
        results: parsed?.results ?? fallbackIntegratedResult(),
      };
    } catch (error) {
      console.warn("Failed to parse stored results", error);
      return { patientInfo: defaultPatient, results: fallbackIntegratedResult() };
    }
  });

  const patientInfo = initialData.patientInfo;
  const results = initialData.results;

  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"none" | "submitted" | "approved" | "needs-review">("none");

  const safeArray = useMemo(() => (arr?: string[]) => (Array.isArray(arr) ? arr : []), []);

  const normalizeConfidenceNumber = (value: number | null | undefined) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return num <= 1 ? num * 100 : num;
  };

  const formatConfidence = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    const percent = normalizeConfidenceNumber(value);
    return `${percent.toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number | null | undefined) => {
    const percent = normalizeConfidenceNumber(confidence);
    if (percent >= 90) return "text-green-600";
    if (percent >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const handleGeneratePDF = () => {
    try {
      downloadClaimPDF(patientInfo, results);
      toast.success("Claim PDF generated and downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleSaveToRecords = () => {
    try {
      const record = saveClaimRecord(patientInfo, results);
      setSavedRecordId(record.recordId);
      toast.success(`Claim saved to records. Record ID: ${record.recordId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save to records. Please try again.");
    }
  };

  const handleSubmitToInsurance = async () => {
    if (!savedRecordId) {
      toast.error("Please save to records first before submitting to insurance");
      return;
    }

    setSubmissionInProgress(true);

    try {
      // Simulate the submission process with animation
      toast.loading("Processing claim for submission...");

      // Get the saved record
      const record = {
        recordId: savedRecordId,
        patientInfo,
        results,
        savedAt: new Date().toISOString(),
        submissionStatus: "draft" as const,
      };

      // Submit and get tracking info
      const submission = submitClaimToInsurance(record);

      // Show submission success
      toast.success(
        `Claim submitted to ${patientInfo.insuranceProvider}. Tracking: ${submission.trackingNumber}`
      );

      setSubmissionStatus("submitted");

      // Simulate insurance processing with delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get processing simulation result
      const processingResult = simulateInsuranceProcessing(submission);

      if (processingResult.approved) {
        toast.success(processingResult.message);
        setSubmissionStatus("approved");
        updateRecordStatus(savedRecordId, "approved");
      } else {
        toast.info(processingResult.message);
        setSubmissionStatus("needs-review");
        updateRecordStatus(savedRecordId, "denied");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit claim. Please try again.");
      setSubmissionStatus("none");
    } finally {
      setSubmissionInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image src="/assets/health-insurance-logo.svg" alt="MediCore-AI" width={32} height={32} />
            <div>
              <h1 className="text-xl font-bold">Processing Results</h1>
              <p className="text-sm text-muted-foreground">AI-extracted codes, validation, and billing preview</p>
              {results.traceId && (
                <p className="text-xs text-muted-foreground/80">Trace ID: {results.traceId}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span>Processing Complete</span>
              </CardTitle>
              <CardDescription>
                Documents processed for <span className="font-semibold">{patientInfo.patientName}</span> (ID: {patientInfo.patientId})
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Confidence Scores</CardTitle>
              <CardDescription>Reliability of extraction and compliance review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className={`text-xl font-bold ${getConfidenceColor(results.aiConfidence?.overall)}`}>
                    {formatConfidence(results.aiConfidence?.overall)}
                  </p>
                  <p className="text-sm text-muted-foreground">Overall</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className={`text-xl font-bold ${getConfidenceColor(results.aiConfidence?.compliance)}`}>
                    {formatConfidence(results.aiConfidence?.compliance)}
                  </p>
                  <p className="text-sm text-muted-foreground">Compliance Risk</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-blue-600">{results.claimSummary.approvalLikelihood}</p>
                  <p className="text-sm text-muted-foreground">Approval Likelihood</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-purple-600">{results.claimSummary.formType}</p>
                  <p className="text-sm text-muted-foreground">Form Type</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
              <CardDescription>Track your claim processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3 bg-blue-50">
                <div className="flex items-center gap-2">
                  {savedRecordId ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {savedRecordId ? "Saved to Records" : "Not Yet Saved"}
                    </p>
                    {savedRecordId && (
                      <p className="text-xs text-muted-foreground">ID: {savedRecordId}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3 bg-green-50">
                <div className="flex items-center gap-2">
                  {submissionStatus !== "none" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {submissionStatus === "none" && "Ready for Submission"}
                      {submissionStatus === "submitted" && "Submitted to Payer"}
                      {submissionStatus === "approved" && "✓ Approved"}
                      {submissionStatus === "needs-review" && "Under Review"}
                    </p>
                    {submissionStatus !== "none" && (
                      <p className="text-xs text-muted-foreground">
                        {patientInfo.insuranceProvider}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation and Compliance</CardTitle>
              <CardDescription>Automated checks aligned to monitor and validator stages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.claimSummary.validationChecks.map((check) => (
                <div key={check.label} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm">{check.label}</p>
                    <Badge variant={check.status === "pass" ? "outline" : "secondary"}>
                      {check.status === "pass" ? "Pass" : "Review"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{check.detail}</p>
                </div>
              ))}
              <div className="rounded-lg border p-3 bg-blue-50/50">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {results.claimSummary.payerNotes}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Information</CardTitle>
              <CardDescription>AI-extracted details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="font-medium">Diagnosis</Label>
                <p className="text-sm bg-muted/50 p-2 rounded">{results.extractedData?.diagnosis || "Not provided"}</p>
              </div>
              <div>
                <Label className="font-medium">Procedures</Label>
                <p className="text-sm bg-muted/50 p-2 rounded">{results.extractedData?.procedures || "Not provided"}</p>
              </div>
              <div>
                <Label className="font-medium">Medications</Label>
                <p className="text-sm bg-muted/50 p-2 rounded">{results.extractedData?.medications || "Not provided"}</p>
              </div>
              <div>
                <Label className="font-medium">Physician</Label>
                <p className="text-sm bg-muted/50 p-2 rounded">{results.extractedData?.physician || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Codes</CardTitle>
              <CardDescription>AI-assigned ICD-10, CPT and HCPCS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-medium">ICD-10</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {safeArray(results.medicalCodes?.icd10).length ? (
                    safeArray(results.medicalCodes?.icd10).map((code) => (
                      <Badge key={code} variant="outline" className="bg-blue-50 text-blue-700">
                        {code}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No ICD-10 codes</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="font-medium">CPT</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {safeArray(results.medicalCodes?.cpt).length ? (
                    safeArray(results.medicalCodes?.cpt).map((code) => (
                      <Badge key={code} variant="outline" className="bg-green-50 text-green-700">
                        {code}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No CPT codes</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="font-medium">HCPCS</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {safeArray(results.medicalCodes?.hcpcs).length ? (
                    safeArray(results.medicalCodes?.hcpcs).map((code) => (
                      <Badge key={code} variant="outline" className="bg-amber-50 text-amber-700">
                        {code}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No HCPCS codes</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Claim Bill Generation</CardTitle>
              <CardDescription>Submission-ready billing preview with line items and totals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-2">Code</th>
                      <th className="text-left py-2 pr-2">Type</th>
                      <th className="text-left py-2 pr-2">Description</th>
                      <th className="text-right py-2 pr-2">Units</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.claimSummary.lineItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 pr-2 font-medium">{item.code}</td>
                        <td className="py-2 pr-2">{item.codeType}</td>
                        <td className="py-2 pr-2 text-muted-foreground">{item.description}</td>
                        <td className="py-2 pr-2 text-right">{item.units}</td>
                        <td className="py-2 text-right">${(item.amount * item.units).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Claim Status</p>
                  <p className="font-medium">{results.claimSummary.claimStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Form Type</p>
                  <p className="font-medium">{results.claimSummary.formType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Bill</p>
                  <p className="text-2xl font-bold text-blue-700">${results.claimSummary.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="pt-6 flex flex-wrap gap-3">
              <Button onClick={handleGeneratePDF} className="gradient-primary">
                <Download className="w-4 h-4 mr-2" />
                Generate Claim PDF
              </Button>
              <Button
                onClick={handleSaveToRecords}
                variant={savedRecordId ? "outline" : "default"}
                disabled={!!savedRecordId}
              >
                <Save className="w-4 h-4 mr-2" />
                {savedRecordId ? "Saved ✓" : "Save to Records"}
              </Button>
              <Button
                onClick={handleSubmitToInsurance}
                variant={submissionStatus !== "none" ? "outline" : "default"}
                disabled={submissionInProgress || !savedRecordId}
                className={submissionStatus === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Send className="w-4 h-4 mr-2" />
                {submissionInProgress
                  ? "Submitting..."
                  : submissionStatus === "approved"
                    ? "Approved ✓"
                    : submissionStatus === "submitted"
                      ? "Submitted ✓"
                      : submissionStatus === "needs-review"
                        ? "Under Review"
                        : "Submit to Insurance"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  sessionStorage.setItem(
                    "patient-view",
                    JSON.stringify({ patientInfo, results }),
                  );
                  router.push("/patient-dashboard");
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Open Patient Transparency View
              </Button>
              <Button variant="ghost" onClick={() => router.push("/hospital-dashboard")}>View New Patient</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HospitalResultsPage;
