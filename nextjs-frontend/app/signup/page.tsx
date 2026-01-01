"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    hospitalId: "",
    patientId: "",
  });
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.userType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    toast.success("Your account has been created successfully");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image src="/assets/health-insurance-logo.svg" alt="MediCore-AI Logo" width={48} height={48} />
            <h1 className="text-3xl font-bold text-foreground">MediCore-AI</h1>
          </div>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card className="shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">SignUp</CardTitle>
            <CardDescription className="text-center">
              Join the future of medical coding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>User Type</Label>
                <Select value={formData.userType} onValueChange={(value) => handleChange("userType", value)}>
                  <SelectTrigger className="w-full justify-between">
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="hospital">Hospital Staff/Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.userType === "hospital" && (
                <div className="space-y-2">
                  <Label htmlFor="hospitalId">Hospital ID</Label>
                  <Input
                    id="hospitalId"
                    placeholder="Enter hospital ID"
                    value={formData.hospitalId}
                    onChange={(e) => handleChange("hospitalId", e.target.value)}
                  />
                </div>
              )}

              {formData.userType === "patient" && (
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    placeholder="Enter patient ID"
                    value={formData.patientId}
                    onChange={(e) => handleChange("patientId", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-white border-0 shadow-medium hover:shadow-large transition-all duration-300"
                size="lg"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;
