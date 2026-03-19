"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Home,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { fallbackIntegratedResult, type IntegratedResult, type PatientInfo } from "@/lib/claim";
import {
  getPatientClaims,
  getPatientClaimsStats,
  getClaimStatusTimeline,
  getDaysUntilProcessing,
  getClaimStatusColor,
  getClaimStatusLabel,
  formatClaimDate,
  type PatientClaim,
} from "@/lib/patient-claims";
import { downloadClaimPDF } from "@/lib/pdf-generator";

const defaultPatient: PatientInfo = {
  patientId: "PT-20431",
  patientName: "Ananya Mehta",
  dateOfService: "2026-03-12",
  insuranceProvider: "Aetna",
  notes: "Follow-up visit with glucose and BP monitoring",
};

const PatientDashboardPage = () => {
  const router = useRouter();
  const [selectedClaim, setSelectedClaim] = useState<PatientClaim | null>(null);
  const [showClaimsHistory, setShowClaimsHistory] = useState(false);

  const [initialData] = useState(() => {
    if (typeof window === "undefined") {
      return { patientInfo: defaultPatient, results: fallbackIntegratedResult() };
    }

    const fromPatientView = sessionStorage.getItem("patient-view");
    const fromHospitalResults = sessionStorage.getItem("hospital-results");
    const source = fromPatientView ?? fromHospitalResults;

    if (!source) {
      return { patientInfo: defaultPatient, results: fallbackIntegratedResult() };
    }

    try {
      const parsed = JSON.parse(source) as { patientInfo: PatientInfo; results: IntegratedResult };
      return {
        patientInfo: parsed?.patientInfo ?? defaultPatient,
        results: parsed?.results ?? fallbackIntegratedResult(),
      };
    } catch (error) {
      console.warn("Failed to parse patient data", error);
      return { patientInfo: defaultPatient, results: fallbackIntegratedResult() };
    }
  });

  const patientInfo = initialData.patientInfo;
  const results = initialData.results;

  // Get all claims for this patient from localStorage
  const allClaims = useMemo(() => {
    if (typeof window === "undefined") return [];
    return getPatientClaims(patientInfo.patientId);
  }, [patientInfo.patientId]);

  // Use selected claim or most recent, or fall back to current data
  const currentClaim: PatientClaim = useMemo(() => {
    if (selectedClaim) return selectedClaim;
    if (allClaims.length > 0) return allClaims[0];
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    
    return {
      recordId: "DEMO-001",
      patientInfo,
      results,
      savedAt: new Date().toISOString(),
      submissionStatus: "submitted",
      submissionDate: new Date().toISOString(),
      trackingNumber: "TRK-DEMO-001",
      estimatedProcessingDate: futureDate.toISOString(),
    };
  }, [selectedClaim, allClaims, patientInfo, results]);

  const currentResults = currentClaim.results;

  const codeCount = useMemo(
    () =>
      currentResults.medicalCodes.icd10.length +
      currentResults.medicalCodes.cpt.length +
      currentResults.medicalCodes.hcpcs.length,
    [currentResults],
  );

  const stats = useMemo(() => getPatientClaimsStats(patientInfo.patientId), [patientInfo.patientId]);

  const amountPaid = useMemo(
    () => Number((currentResults.claimSummary.totalAmount * 0.7).toFixed(2)),
    [currentResults],
  );
  const amountPending = useMemo(
    () => Number((currentResults.claimSummary.totalAmount - amountPaid).toFixed(2)),
    [currentResults, amountPaid],
  );

  const timeline = useMemo(() => getClaimStatusTimeline(currentClaim), [currentClaim]);
  const daysUntilProcessing = useMemo(() => getDaysUntilProcessing(currentClaim), [currentClaim]);

  const downloadSummary = () => {
    toast.info("Generating patient summary PDF...");
    downloadClaimPDF(currentClaim.patientInfo, currentResults);
  };

  const viewClaimForm = () => {
    toast.info("Generating claim form PDF...");
    downloadClaimPDF(currentClaim.patientInfo, currentResults);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image src="/assets/health-insurance-logo.svg" alt="MediCore-AI" width={32} height={32} />
            <div>
              <h1 className="text-xl font-bold">Patient Dashboard</h1>
              <p className="text-sm text-muted-foreground">Diagnosis, coding, cost transparency, and claim progress</p>
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

      <div className="container mx-auto px-6 py-8 max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Welcome, {patientInfo.patientName}
                </CardTitle>
                <CardDescription>
                  Patient ID: {patientInfo.patientId} | Insurance: {patientInfo.insuranceProvider} | Date of Service:{" "}
                  {patientInfo.dateOfService}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClaimsHistory(!showClaimsHistory)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Claims History ({allClaims.length})
              </Button>
            </div>
          </CardHeader>
        </Card>

        {showClaimsHistory && allClaims.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Claims History</CardTitle>
              <CardDescription>Click on a claim to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allClaims.map((claim) => (
                  <button
                    key={claim.recordId}
                    onClick={() => {
                      setSelectedClaim(claim);
                      setShowClaimsHistory(false);
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      selectedClaim?.recordId === claim.recordId
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-muted-foreground">{claim.recordId}</span>
                      <Badge className={`text-xs normal-case ${getClaimStatusColor(claim.submissionStatus)}`}>
                        {getClaimStatusLabel(claim.submissionStatus)}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">${claim.results.claimSummary.totalAmount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatClaimDate(claim.savedAt)}
                    </div>
                    {claim.trackingNumber && (
                      <div className="text-xs text-blue-600 mt-1 font-mono">{claim.trackingNumber}</div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Claims Overview</CardTitle>
            <CardDescription>Your submission and approval statistics</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-gray-50 border">
              <p className="text-2xl font-bold">{stats.totalClaims}</p>
              <p className="text-xs text-muted-foreground">Total Claims</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 border">
              <p className="text-2xl font-bold text-blue-700">{stats.submittedClaims}</p>
              <p className="text-xs text-blue-800">In Progress</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 border">
              <p className="text-2xl font-bold text-green-700">{stats.approvedClaims}</p>
              <p className="text-xs text-green-800">Approved</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 border">
              <p className="text-2xl font-bold text-red-700">{stats.deniedClaims}</p>
              <p className="text-xs text-red-800">Denied</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Claim Status</CardTitle>
                <CardDescription>Tracking: {currentClaim.trackingNumber || "Not submitted"}</CardDescription>
              </div>
              <Badge
                className={`text-sm normal-case ${getClaimStatusColor(currentClaim.submissionStatus)}`}
              >
                {getClaimStatusLabel(currentClaim.submissionStatus)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Submitted</Label>
                <p className="text-sm font-medium">{formatClaimDate(currentClaim.submissionDate)}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Estimated Processing</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium">
                    {daysUntilProcessing > 0 ? `${daysUntilProcessing} days` : "Processing"}
                  </p>
                </div>
              </div>
            </div>
            {currentClaim.payerNotes && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-1">Payer Notes:</p>
                <p className="text-sm text-blue-800">{currentClaim.payerNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnosis and Procedures</CardTitle>
            <CardDescription>Structured by the AI clinical and coding pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-medium">Diagnosis</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">{currentResults.extractedData.diagnosis}</p>
            </div>
            <div>
              <Label className="font-medium">Procedures</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">{currentResults.extractedData.procedures}</p>
            </div>
            <div>
              <Label className="font-medium">Medications</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">{currentResults.extractedData.medications}</p>
            </div>
            <div>
              <Label className="font-medium">Physician</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">{currentResults.extractedData.physician}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claim Progress Timeline</CardTitle>
            <CardDescription>End-to-end status from coding to payer handling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={item.step} className="flex items-start gap-4">
                <div
                  className={`mt-1 h-8 w-8 rounded-full text-xs flex items-center justify-center font-semibold flex-shrink-0 ${
                    item.completed
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.completed ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${item.completed ? "text-green-700" : "text-gray-600"}`}>
                    {item.step}
                  </p>
                  {item.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">{formatClaimDate(item.timestamp)}</p>
                  )}
                  {item.details && (
                    <p className="text-xs text-gray-600 mt-1 italic">{item.details}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coding Transparency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-medium">ICD-10 Codes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentResults.medicalCodes.icd10.map((code) => (
                  <Badge key={code} variant="outline" className="bg-blue-50 text-blue-700">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-medium">CPT Codes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentResults.medicalCodes.cpt.map((code) => (
                  <Badge key={code} variant="outline" className="bg-green-50 text-green-700">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-medium">HCPCS Codes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentResults.medicalCodes.hcpcs.length > 0 ? (
                  currentResults.medicalCodes.hcpcs.map((code) => (
                    <Badge key={code} variant="outline" className="bg-amber-50 text-amber-700">
                      {code}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No HCPCS codes assigned</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
            <CardDescription>Generated from claim line items</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-2xl font-bold text-green-700">${currentResults.claimSummary.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-green-800">Total Bill</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">${amountPaid.toFixed(2)}</p>
              <p className="text-sm text-blue-800">Estimated Covered</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xl font-bold text-amber-700">${amountPending.toFixed(2)}</p>
              <p className="text-sm text-amber-800">Estimated Patient Responsibility</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-lg font-bold text-purple-700">{codeCount}</p>
              <p className="text-sm text-purple-800">Total Codes Assigned</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Bill Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Code</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentResults.claimSummary.lineItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2 font-medium">{item.code}</td>
                      <td className="py-2">{item.codeType}</td>
                      <td className="py-2 text-muted-foreground">{item.description}</td>
                      <td className="py-2 text-right">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6 flex flex-wrap gap-4 justify-center">
            <Button onClick={downloadSummary} className="gradient-primary gap-2">
              <Download className="w-4 h-4" />
              Download Patient Summary
            </Button>
            <Button onClick={viewClaimForm} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              View Claim Form ({currentResults.claimSummary.formType})
            </Button>
            {allClaims.length === 0 && (
              <Button variant="secondary" disabled className="gap-2">
                <AlertCircle className="w-4 h-4" />
                No claims submitted yet
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
