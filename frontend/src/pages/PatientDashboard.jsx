import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, ArrowLeft, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import logoSvg from "@/assets/health-insurance-logo.svg";

const PatientDashboard = () => {
  const navigate = useNavigate();

  // Mocked patient results (in real app, fetch from API)
  const results = {
    patientId: "P-12345",
    patientName: "John Doe",
    insuranceProvider: "Aetna",
    dateOfService: "2025-09-15",
    extractedData: {
      diagnosis: "Hypertension, Type 2 Diabetes",
      procedures: "Routine checkup, Blood pressure monitoring, Glucose test",
      medications: "Metformin 500mg, Lisinopril 10mg",
      physician: "Dr. Sarah Johnson",
    },
    medicalCodes: {
      icd10: ["I10", "E11.9", "Z00.00"],
      cpt: ["99213", "93000", "82947"],
    },
    claimAmount: 1250.0,
    estimatedApproval: "High (92% confidence)",
    claimStatus: "Submitted to Insurance",
  };

  const downloadSummary = () => {
    toast.info("Preparing summary PDF...");
    setTimeout(() => {
      toast.success("Download ready!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={logoSvg} alt="MediCode-AI" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Patient Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Transparency into your diagnosis, codes & claim
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="w-6 h-6 mr-2" />
              Welcome, {results.patientName}
            </CardTitle>
            <CardDescription>
              Patient ID: {results.patientId} | Insurance:{" "}
              {results.insuranceProvider}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Diagnosis & Procedures */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis & Procedures</CardTitle>
            <CardDescription>
              AI-extracted details from your medical report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-medium">Diagnosis</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">
                {results.extractedData.diagnosis}
              </p>
            </div>
            <div>
              <Label className="font-medium">Procedures</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">
                {results.extractedData.procedures}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Medications & Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>Medications & Physician</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-medium">Medications</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">
                {results.extractedData.medications}
              </p>
            </div>
            <div>
              <Label className="font-medium">Physician</Label>
              <p className="text-sm bg-muted/50 p-2 rounded">
                {results.extractedData.physician}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Codes */}
        <Card>
          <CardHeader>
            <CardTitle>ICD-10 Codes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {results.medicalCodes.icd10.map((code, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-blue-50 text-blue-700"
              >
                {code}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CPT Codes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {results.medicalCodes.cpt.map((code, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-green-50 text-green-700"
              >
                {code}
              </Badge>
            ))}
          </CardContent>
        </Card>

        {/* Claim Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Claim Summary</CardTitle>
            <CardDescription>Generated by AI for billing clarity</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                ${results.claimAmount.toFixed(2)}
              </p>
              <p className="text-sm text-green-700">Claim Amount</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-lg font-bold text-blue-600">
                {results.estimatedApproval}
              </p>
              <p className="text-sm text-blue-700">Approval Likelihood</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-lg font-bold text-purple-600">
                {results.claimStatus}
              </p>
              <p className="text-sm text-purple-700">Claim Status</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 flex flex-wrap gap-4 justify-center">
            <Button onClick={downloadSummary} className="gradient-primary">
              <Download className="w-4 h-4 mr-2" />
              Download Summary PDF
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Detailed Bill
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
