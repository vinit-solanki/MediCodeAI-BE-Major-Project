"use client";

import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type AgentStatus = "pending" | "running" | "completed" | "failed";

export interface AgentStep {
  name: string;
  description: string;
  status: AgentStatus;
  progress?: number;
}

interface AIAgentPipelineProps {
  steps: AgentStep[];
  overallProgress?: number;
  isProcessing: boolean;
}

export function AIAgentPipeline({
  steps,
  overallProgress,
  isProcessing,
}: AIAgentPipelineProps) {
  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "running":
        return "bg-blue-50 border-blue-200 animate-pulse";
      case "failed":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="animate-spin">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <span>Multi-Agent AI Processing Pipeline</span>
        </CardTitle>
        <CardDescription>
          AI agents working in sequence to analyze, code, and validate your medical documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        {overallProgress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Agent Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.name}>
              {/* Agent Card */}
              <div
                className={`p-4 rounded-lg border-2 transition-all ${getStatusColor(step.status)}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{step.name}</h4>
                    <p className="text-xs text-muted-foreground">{step.description}</p>

                    {/* Status Text */}
                    <p className="text-xs font-medium mt-2">
                      {step.status === "running" && (
                        <span className="text-blue-600">Processing...</span>
                      )}
                      {step.status === "completed" && (
                        <span className="text-green-600">✓ Completed</span>
                      )}
                      {step.status === "failed" && (
                        <span className="text-red-600">✗ Failed</span>
                      )}
                      {step.status === "pending" && (
                        <span className="text-gray-500">Waiting...</span>
                      )}
                    </p>
                  </div>

                  {/* Progress */}
                  {step.progress !== undefined && step.status === "running" && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-medium text-blue-600">
                        {Math.round(step.progress)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Step Progress Bar */}
                {step.progress !== undefined && (
                  <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Connection Line (between steps) */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-1 h-4 bg-gradient-to-b from-gray-300 to-gray-200" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status Summary */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          <p>
            {isProcessing
              ? "AI engines are analyzing your medical documents. This typically takes 30-60 seconds."
              : "Processing complete. Review results above."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
