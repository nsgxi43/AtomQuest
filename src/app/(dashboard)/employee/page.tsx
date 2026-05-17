"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { WeightageBar } from "@/components/ui/WeightageBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Goal, GoalSheet } from "@/types";

export default function EmployeeGoalPage() {
  const { data: session } = useSession();
  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch("/api/goal-sheets");
        const data = await response.json();
        setGoalSheet(data.goalSheet);
        setGoals(data.goals || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const totalWeightage = goals.reduce((sum, goal) => sum + goal.weightage, 0);

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGoals(goals.filter((g) => g.id !== goalId));
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleSubmitGoalSheet = async () => {
    if (totalWeightage !== 100) {
      alert("Total weightage must equal 100%");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/goal-sheets/${goalSheet?.id}/submit`, {
        method: "POST",
      });

      if (response.ok) {
        setGoalSheet((prev) =>
          prev ? { ...prev, status: "SUBMITTED" } : null
        );
      }
    } catch (error) {
      console.error("Error submitting goal sheet:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!goalSheet) {
    return <div className="p-6">Error loading goal sheet</div>;
  }

  const canEdit =
    goalSheet.status === "DRAFT" || goalSheet.status === "RETURNED";
  const isLocked = goalSheet.status === "LOCKED";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-600 mt-1">Cycle Year: {goalSheet.cycleYear}</p>
        </div>
        <StatusBadge status={goalSheet.status} type="goal-sheet" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <WeightageBar currentWeightage={totalWeightage} />
          {canEdit && (
            <div className="flex gap-2">
              <Link href="/employee/goals/new">
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                  Add Goal
                </Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Start by adding your first goal for this cycle"
          ctaLabel={canEdit ? "Add Goal" : undefined}
          onCTA={canEdit ? () => window.location.href = "/employee/goals/new" : undefined}
        />
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardBody className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Thrust Area</p>
                    <p className="font-medium text-gray-900">
                      {goal.thrustArea}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unit of Measure</p>
                    <p className="font-medium text-gray-900">{goal.uom}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Target</p>
                    <p className="font-medium text-gray-900">{goal.target}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Weightage</p>
                    <p className="font-medium text-gray-900">
                      {goal.weightage}%
                    </p>
                  </div>
                </div>

                {goal.isShared && (
                  <Badge variant="approved">Shared Goal</Badge>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {canEdit && totalWeightage === 100 && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            loading={submitting}
            onClick={handleSubmitGoalSheet}
            className="flex-1"
          >
            Submit for Approval
          </Button>
        </div>
      )}

      {isLocked && (
        <div className="flex gap-2">
          <Link href="/employee/track" className="flex-1">
            <Button variant="primary" className="w-full">
              Go to Quarterly Tracking
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
