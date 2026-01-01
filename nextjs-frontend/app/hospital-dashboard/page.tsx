"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Brain, FileText, Home, Upload, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { codePdf } from "@/lib/api";

const processingSteps = [
  "Uploading documents...",
  "OCR processing...",
  "AI analysis in progress...",
  "Extracting medical codes...",
  "Generating claim forms...",
  "Completed!",
];

const HospitalDashboardPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [patientInfo, setPatientInfo] = useState({
    patientId: "",
    patientName: "",
    dateOfService: "",
    insuranceProvider: "",
    notes: "",
  });
  const router = useRouter();

  const normalizeResult = useCallback((data: any) => {
    const safeArray = (value: unknown): any[] => (Array.isArray(value) ? value : []);
    const toCodes = (arr: unknown[]) =>
      safeArray(arr)
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && "code" in entry) return (entry as any).code;
          if (entry && typeof entry === "object" && "icd_code" in entry) return (entry as any).icd_code;
          if (entry && typeof entry === "object" && "ICD_code" in entry) return (entry as any).ICD_code;
          if (entry && typeof entry === "object" && "cpt_code" in entry) return (entry as any).cpt_code;
          if (entry && typeof entry === "object" && "hcpcs_code" in entry) return (entry as any).hcpcs_code;
          return null;
        })
        .filter(Boolean);

    const medicalEntities = data?.medical_entities || {};
    const fallbackText = (value: any, alt: string) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return alt;
      if (Array.isArray(value)) return value.join(", ");
      if (typeof value === "object") {
        return Object.values(value as Record<string, unknown>)
          .filter(Boolean)
          .join(", ");
      }
      return value as string;
    };

    return {
      extractedData: {
        diagnosis: fallbackText(medicalEntities.diagnoses || medicalEntities.conditions, "Not provided"),
        procedures: fallbackText(medicalEntities.procedures || medicalEntities.treatments, "Not provided"),
        medications: fallbackText(medicalEntities.medications, "Not provided"),
        physician: fallbackText(medicalEntities.provider || medicalEntities.physician, "Unknown"),
      },
      medicalCodes: {
        icd10: toCodes(data?.icd_codes),
        cpt: toCodes(data?.cpt_codes),
        hcpcs: toCodes(data?.hcpcs_codes),
      },
      aiConfidence: {
        overall: data?.evaluation?.overall_score ?? null,
        compliance: data?.evaluation?.compliance_risk ?? null,
      },
      traceId: data?.trace_id || null,
    };
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadedFiles((prev) => [...prev, ...files]);
    toast.success(`${files.length} file(s) added successfully`);
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessing = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }
    if (!patientInfo.patientId || !patientInfo.patientName) {
      toast.error("Please fill in patient ID and name");
      return;
    }

    setProcessing(true);
    setProcessingStep(0);

    const stepTimer = setInterval(() => {
      setProcessingStep((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const primaryFile = uploadedFiles[0];
      const data = await codePdf(primaryFile);
      const normalized = normalizeResult(data);

      toast.success("Processing complete");
      sessionStorage.setItem(
        "hospital-results",
        JSON.stringify({ patientInfo, results: normalized })
      );
      router.push("/hospital-results");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Processing failed. Please try again.");
    } finally {
      clearInterval(stepTimer);
      setProcessing(false);
      setProcessingStep(processingSteps.length - 1);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return <FileText className="w-5 h-5 text-primary" />;
    if (extension === "txt") return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image src="/assets/health-insurance-logo.svg" alt="MediCore-AI" width={32} height={32} />
            <div>
              <h1 className="text-xl font-bold">Hospital Dashboard</h1>
              <p className="text-sm text-muted-foreground">AI-powered medical coding and claim generation</p>
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

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Enter patient details for claim processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Patient ID *</Label>
                  <Input
                    placeholder="Enter patient ID"
                    value={patientInfo.patientId}
                    onChange={(e) => setPatientInfo((prev) => ({ ...prev, patientId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Patient Name *</Label>
                  <Input
                    placeholder="Enter patient name"
                    value={patientInfo.patientName}
                    onChange={(e) => setPatientInfo((prev) => ({ ...prev, patientName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Date of Service</Label>
                  <Input
                    type="date"
                    value={patientInfo.dateOfService}
                    onChange={(e) => setPatientInfo((prev) => ({ ...prev, dateOfService: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Insurance Provider</Label>
                  <Select
                    value={patientInfo.insuranceProvider}
                    onValueChange={(value) => setPatientInfo((prev) => ({ ...prev, insuranceProvider: value }))}
                  >
                    <SelectTrigger className="w-full justify-between">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue-cross">Blue Cross Blue Shield</SelectItem>
                      <SelectItem value="aetna">Aetna</SelectItem>
                      <SelectItem value="united">United Healthcare</SelectItem>
                      <SelectItem value="cigna">Cigna</SelectItem>
                      <SelectItem value="humana">Humana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Enter any additional information..."
                  value={patientInfo.notes}
                  onChange={(e) => setPatientInfo((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Upload discharge summaries, prescriptions, reports, etc.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mb-4">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-md font-medium mb-2">Drop files here or click to browse</h3>
                  <Input type="file" multiple accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" id="file-upload" />
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Select Files
                    </label>
                  </Button>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={file.name + index} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.name)}
                          <span>{file.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {processing ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <span>AI Processing</span>
                  </CardTitle>
                  <CardDescription>Our AI is analyzing your documents...</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={((processingStep + 1) / processingSteps.length) * 100} className="w-full" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {processingSteps[processingStep]} (Step {processingStep + 1} of {processingSteps.length})
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleProcessing}
                    className="w-full gradient-primary text-white border-0"
                    size="lg"
                    disabled={uploadedFiles.length === 0}
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Start AI Processing
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboardPage;
