"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateGoalSchema, CreateGoalInput } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { WeightageBar } from "@/components/ui/WeightageBar";
import Link from "next/link";

export default function CreateGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentWeightage, setCurrentWeightage] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
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
        alert(error.error || "Failed to create goal");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("An error occurred while creating the goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Goal</h1>
        <p className="text-gray-600 mt-1">Add a new goal to your goal sheet</p>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                placeholder="Describe your goal in detail"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("description")}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit of Measure
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("uom")}
                >
                  <option value="NUMERIC_MIN">Numeric (Minimize)</option>
                  <option value="NUMERIC_MAX">Numeric (Maximize)</option>
                  <option value="TIMELINE">Timeline</option>
                  <option value="ZERO">Zero/Binary</option>
                </select>
                {errors.uom && (
                  <p className="text-red-600 text-sm mt-1">{errors.uom.message}</p>
                )}
              </div>

              <Input
                label="Target"
                placeholder="e.g., 100, 2025-12-31"
                {...register("target")}
                error={errors.target?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weightage (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                step="5"
                {...register("weightage", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.weightage && (
                <p className="text-red-600 text-sm mt-1">{errors.weightage.message}</p>
              )}
              <p className="text-gray-600 text-sm mt-2">
                Minimum 10%, Maximum 100%
              </p>
            </div>

            <WeightageBar currentWeightage={weightage} label="Current Weightage" />

            <div className="flex gap-2 pt-6">
              <Link href="/employee" className="flex-1">
                <Button variant="ghost" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                loading={loading}
                className="flex-1"
              >
                Create Goal
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
