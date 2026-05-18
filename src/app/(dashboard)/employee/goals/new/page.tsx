"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateGoalSchema, CreateGoalInput } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { WeightageBar } from "@/components/ui/WeightageBar";
import { GovernanceInsightsPanel } from "@/components/GovernanceInsightsPanel";
import { GovernanceAnalysis } from "@/lib/ai/types";
import Link from "next/link";

export default function CreateGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // AI Analysis State
  const [analysis, setAnalysis] = useState<GovernanceAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isFallbackAnalysis, setIsFallbackAnalysis] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(CreateGoalSchema),
    defaultValues: {
      weightage: 20,
    },
  });

  const weightage = watch("weightage");

  const onSubmit = async (data: CreateGoalInput) => {
    setLoading(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push("/employee");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create goal");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("An error occurred while creating the goal");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeGovernance = async () => {
    setIsDrawerOpen(true);
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      setIsFallbackAnalysis(false);

      const formData = getValues();

      // Call AI analysis API
      const response = await fetch("/api/ai/analyze-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: [
            {
              title: formData.title,
              description: formData.description,
              thrustArea: formData.thrustArea,
              uom: formData.uom,
              target: formData.target,
              weightage: formData.weightage,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setAnalysisError(
          error.error || "Failed to analyze goal governance quality"
        );
        return;
      }

      const result = await response.json();

      // Handle both direct analysis and fallback analysis
      if (result.analysis) {
        setAnalysis(result.analysis);
        setIsFallbackAnalysis(result.isFallback || false);
        
        if (!result.isFallback) {
          toast.success("Analysis complete", { duration: 3000 });
        }
      } else {
        setAnalysisError("No analysis data received");
      }
    } catch (error) {
      console.error("Error calling AI analysis:", error);
      setAnalysisError("An error occurred while analyzing your goal");
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create New Goal
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Add a new goal to your goal sheet for this performance cycle
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="w-full">
          <Card className="shadow-lg border-0 ring-1 ring-gray-200/50">
            <CardBody className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Input
                  label="Thrust Area"
                  placeholder="e.g., Technology, Customer Service"
                  {...register("thrustArea")}
                  error={errors.thrustArea?.message}
                />

                <Input
                  label="Goal Title"
                  placeholder="e.g., Implement new feature"
                  {...register("title")}
                  error={errors.title?.message}
                />

                <Textarea
                  label="Description (Optional)"
                  placeholder="Describe your goal in detail"
                  {...register("description")}
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-6">
                  <Select
                    label="Unit of Measure"
                    {...register("uom")}
                    error={errors.uom?.message}
                  >
                    <option value="NUMERIC_MIN">Numeric (Minimize)</option>
                    <option value="NUMERIC_MAX">Numeric (Maximize)</option>
                    <option value="TIMELINE">Timeline</option>
                    <option value="ZERO">Zero/Binary</option>
                  </Select>

                  <Input
                    label="Target"
                    placeholder="e.g., 100, 2025-12-31"
                    {...register("target")}
                    error={errors.target?.message}
                  />
                </div>

                <Input
                  label="Weightage (%)"
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  {...register("weightage", { valueAsNumber: true })}
                  error={errors.weightage?.message}
                  helperText="Minimum 10%, Maximum 100%"
                />

                <div className="pt-2">
                  <WeightageBar
                    currentWeightage={weightage}
                    label="Current Weightage"
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <Link href="/employee" className="flex-1">
                    <Button
                      variant="secondary"
                      className="w-full py-3"
                      type="button"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={loading}
                    className="flex-1 py-3 shadow-blue-500/20"
                  >
                    Create Goal
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      // Trigger AI Analysis and open drawer
                      handleAnalyzeGovernance();
                    }}
                    loading={analysisLoading}
                    className="flex-1 py-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Analyze with AI
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Slide-over Enterprise Drawer */}
      <GovernanceInsightsPanel
        analysis={analysis}
        isLoading={analysisLoading}
        error={analysisError}
        onAnalyze={handleAnalyzeGovernance}
        isAnalyzing={analysisLoading}
        isFallback={isFallbackAnalysis}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
