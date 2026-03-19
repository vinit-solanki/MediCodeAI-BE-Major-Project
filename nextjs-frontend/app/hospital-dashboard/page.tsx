"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, FileText, Home, Upload, ArrowLeft, X, Database, Activity } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AIAgentPipeline, type AgentStep } from "@/components/AIAgentPipeline";
import { buildClaimSummary, demoPatientCase } from "@/lib/claim";
import { healthCheck, processMedicalText, USE_MOCK } from "@/lib/api";

const agentSteps: AgentStep[] = [
  {
    name: "Document Intake Agent",
    description: "Uploading and parsing medical documents for processing",
    status: "pending",
  },
  {
    name: "Entity Extraction Agent",
    description: "Extracting clinical entities: diagnoses, procedures, medications",
    status: "pending",
  },
  {
    name: "ICD-10 Coding Agent",
    description: "Assigning ICD-10 diagnosis codes using medical ML model",
    status: "pending",
  },
  {
    name: "CPT/HCPCS Agent",
    description: "Generating procedure codes and healthcare common procedure codes",
    status: "pending",
  },
  {
    name: "Compliance Judge Agent",
    description: "Evaluating coding accuracy and payer policy compliance",
    status: "pending",
  },
  {
    name: "Claim Generation Agent",
    description: "Generating claim forms and billing summaries",
    status: "pending",
  },
];

const HospitalDashboardPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [medicalReportText, setMedicalReportText] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "healthy" | "unreachable">("checking");
  const [agentStatuses, setAgentStatuses] = useState<AgentStep[]>(agentSteps);
  const [overallProgress, setOverallProgress] = useState(0);
  const [patientInfo, setPatientInfo] = useState({
    patientId: "",
    patientName: "",
    dateOfService: "",
    insuranceProvider: "",
    notes: "",
  });
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      if (USE_MOCK) {
        setApiStatus("healthy");
        return;
      }

      try {
        await healthCheck();
        setApiStatus("healthy");
      } catch {
        setApiStatus("unreachable");
      }
    };

    check();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadedFiles((prev) => [...prev, ...files]);
    toast.success(`${files.length} file(s) added successfully`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const applyDemoCase = () => {
    setPatientInfo(demoPatientCase.patientInfo);
    setMedicalReportText(demoPatientCase.medicalNote);
    toast.success("Demo case loaded");
  };

  const readTextAttachments = async (): Promise<string> => {
    const textFiles = uploadedFiles.filter((file) => file.name.toLowerCase().endsWith(".txt"));
    if (!textFiles.length) return "";

    const chunks = await Promise.all(textFiles.map((file) => file.text().catch(() => "")));
    return chunks.filter(Boolean).join("\n\n");
  };

  const simulateAgentProcessing = async () => {
    const newStatuses = [...agentSteps];
    const totalDuration = 7000; // Total time for all agents
    const stepDuration = totalDuration / agentSteps.length;

    for (let i = 0; i < agentSteps.length; i++) {
      // Mark current as running, previous as completed
      if (i > 0) newStatuses[i - 1].status = "completed";
      newStatuses[i].status = "running";
      newStatuses[i].progress = 0;
      setAgentStatuses([...newStatuses]);

      // Simulate progress for this agent
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / stepDuration) * 100, 100);
        newStatuses[i].progress = progress;
        setAgentStatuses([...newStatuses]);

        const overallProg = ((i * stepDuration + elapsed) / totalDuration) * 100;
        setOverallProgress(Math.min(overallProg, 99));

        if (progress >= 100) clearInterval(progressInterval);
      }, 100);

      // Wait for this agent to complete
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    // Mark last agent as completed
    newStatuses[agentSteps.length - 1].status = "completed";
    setAgentStatuses([...newStatuses]);
    setOverallProgress(100);
  };

  const handleProcessing = async () => {
    if (!patientInfo.patientId || !patientInfo.patientName) {
      toast.error("Please fill in patient ID and name");
      return;
    }

    const attachmentText = await readTextAttachments();
    const reportText = [medicalReportText.trim(), attachmentText.trim()].filter(Boolean).join("\n\n");

    if (reportText.length < 10) {
      toast.error("Please add clinical note text or upload at least one .txt medical report");
      return;
    }

    setProcessing(true);
    setAgentStatuses(agentSteps);
    setOverallProgress(0);

    try {
      // Start agent simulation
      simulateAgentProcessing();

      // Process with API
      const normalized = await processMedicalText({
        medical_report_text: reportText,
        include_evaluation: true,
      });

      const claimSummary = buildClaimSummary(normalized.medicalCodes, normalized.aiConfidence);

      // Wait for agents to finish
      await new Promise((resolve) => setTimeout(resolve, 7500));

      toast.success("Processing complete - All agents finished");
      sessionStorage.setItem(
        "hospital-results",
        JSON.stringify({
          patientInfo,
          reportText,
          results: {
            ...normalized,
            claimSummary,
          },
        })
      );
      router.push("/hospital-results");
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Processing failed. Please try again.");
    } finally {
      setProcessing(false);
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
              <p className="text-sm text-muted-foreground">Multi-agent medical coding, billing, and claim generation</p>
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
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>Enter patient details and clinical note to generate coding + claim output</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4" />
                    <span>
                      API Status:{" "}
                      <span className={apiStatus === "healthy" ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                        {apiStatus === "checking"
                          ? "Checking"
                          : apiStatus === "healthy"
                            ? USE_MOCK
                              ? "Demo Mode"
                              : "Connected"
                            : "Unreachable (demo still available)"}
                      </span>
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={applyDemoCase}>
                    <Database className="w-4 h-4 mr-2" />
                    Load Demo Case
                  </Button>
                </div>

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
                <div>
                  <Label>Clinical Note / Medical Report Text *</Label>
                  <Textarea
                    placeholder="Paste discharge summary, clinical note, or treatment summary here..."
                    value={medicalReportText}
                    onChange={(e) => setMedicalReportText(e.target.value)}
                    className="min-h-40"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload supporting records for workflow completeness. Text files are appended to clinical note.
                </CardDescription>
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
              <AIAgentPipeline
                steps={agentStatuses}
                overallProgress={overallProgress}
                isProcessing={processing}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleProcessing}
                    className="w-full gradient-primary text-white border-0"
                    size="lg"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Run Multi-Agent Coding Pipeline
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
