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

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password || !userType) {
      toast.error("Please fill in all fields");
      return;
    }

    toast.success(`Welcome to MediCore-AI ${userType} Dashboard`);

    if (userType === "patient") {
      router.push("/patient-dashboard");
    } else {
      router.push("/hospital-dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image src="/assets/health-insurance-logo.svg" alt="MediCore-AI Logo" width={48} height={48} />
            <h1 className="text-3xl font-bold text-foreground">MediCore-AI</h1>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Access your medical coding dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>User Type</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger className="w-full justify-between">
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="hospital">Hospital Staff/Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-white border-0 shadow-medium hover:shadow-large transition-all duration-300"
                size="lg"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
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

export default LoginPage;
