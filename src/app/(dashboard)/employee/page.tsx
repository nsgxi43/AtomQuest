"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Trash2, Plus, Lock, Share2 } from "lucide-react";
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

  // Inline weightage editing for shared goals
  const [editingWeightageId, setEditingWeightageId] = useState<string | null>(
    null
  );
  const [editWeightageValue, setEditWeightageValue] = useState<string>("");
  const [savingWeightage, setSavingWeightage] = useState(false);

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
    const goal = goals.find((g) => g.id === goalId);
    if (goal?.isShared) {
      alert("Shared goals cannot be deleted by employees.");
      return;
    }
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
    if (Math.abs(totalWeightage - 100) > 0.01) {
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
      } else {
        const err = await response.json();
        alert(err.error || "Failed to submit goal sheet");
      }
    } catch (error) {
      console.error("Error submitting goal sheet:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartWeightageEdit = (goal: Goal) => {
    setEditingWeightageId(goal.id);
    setEditWeightageValue(goal.weightage.toString());
  };

  const handleSaveWeightage = async (goalId: string) => {
    const newWeightage = parseFloat(editWeightageValue);
    if (isNaN(newWeightage) || newWeightage < 10 || newWeightage > 100) {
      alert("Weightage must be between 10 and 100");
      return;
    }

    // Check total would still equal 100
    const othersTotal = goals
      .filter((g) => g.id !== goalId)
      .reduce((s, g) => s + g.weightage, 0);
    if (Math.abs(othersTotal + newWeightage - 100) > 0.01 && goals.length > 1) {
      const ok = confirm(
        `Total weightage would be ${(othersTotal + newWeightage).toFixed(1)}%. You can still save and adjust other goals later. Continue?`
      );
      if (!ok) return;
    }

    setSavingWeightage(true);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightage: newWeightage }),
      });

      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
        setEditingWeightageId(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update weightage");
      }
    } catch (e) {
      alert("An error occurred");
    } finally {
      setSavingWeightage(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
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
          onCTA={
            canEdit
              ? () => (window.location.href = "/employee/goals/new")
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardBody className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {goal.title}
                      </h3>
                      {goal.isShared && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                          <Share2 className="w-3 h-3" />
                          Shared
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {goal.description}
                      </p>
                    )}
                    {goal.isShared && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded mt-2 inline-block">
                        🔒 Title and target are fixed by your manager. You may
                        only edit your weightage.
                      </p>
                    )}
                  </div>
                  {canEdit && !goal.isShared && (
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-700 ml-3"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  {goal.isShared && (
                    <Lock className="w-4 h-4 text-gray-400 ml-3 mt-0.5 shrink-0" />
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
                    {/* Shared goals: employee can edit weightage only */}
                    {goal.isShared && canEdit ? (
                      editingWeightageId === goal.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            step="5"
                            value={editWeightageValue}
                            onChange={(e) =>
                              setEditWeightageValue(e.target.value)
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500 text-sm">%</span>
                          <button
                            onClick={() => handleSaveWeightage(goal.id)}
                            disabled={savingWeightage}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {savingWeightage ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingWeightageId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {goal.weightage}%
                          </p>
                          <button
                            onClick={() => handleStartWeightageEdit(goal)}
                            className="text-xs text-blue-600 hover:text-blue-700 underline"
                          >
                            Edit
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="font-medium text-gray-900">
                        {goal.weightage}%
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {canEdit && Math.abs(totalWeightage - 100) < 0.01 && (
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
