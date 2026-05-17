"use client";
import toast from "react-hot-toast";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Share2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GoalSheet, Goal } from "@/types";

interface ManagerApprovePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ManagerApprovePage({
  params,
}: ManagerApprovePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [returnQuarter, setReturnQuarter] = useState("Q1");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<
    Record<string, { target: string; weightage: string }>
  >({});
  const [savingGoal, setSavingGoal] = useState<string | null>(null);
  const [editError, setEditError] = useState<string>("");

  useEffect(() => {
    const fetchGoalSheet = async () => {
      try {
        const response = await fetch(`/api/goal-sheets/${id}`);
        const data = await response.json();
        setGoalSheet(data);
        setGoals(data.goals || []);
      } catch (error) {
        console.error("Error fetching goal sheet:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoalSheet();
  }, [id]);

  // Derived: total weightage using live edit values where applicable
  const totalWeightage = goals.reduce((sum, g) => {
    if (editingGoalId === g.id && editValues[g.id]) {
      return sum + (parseFloat(editValues[g.id].weightage) || 0);
    }
    return sum + g.weightage;
  }, 0);

  const weightageOk = Math.abs(totalWeightage - 100) < 0.01;

  const handleApprove = async () => {
    if (!weightageOk) {
      toast.error(`Total weightage is ${totalWeightage}%. Must equal 100% before approving.`);
      return;
    }
    setApproving(true);
    try {
      const response = await fetch(`/api/goal-sheets/${id}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        setGoalSheet((prev) =>
          prev ? { ...prev, status: "LOCKED" } : null
        );
        toast.success("Goal sheet approved and locked successfully");
        router.push("/manager");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to approve goal sheet");
      }
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("An error occurred while approving");
    } finally {
      setApproving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnComment || returnComment.length < 10) {
      toast.error("Please provide a return reason (min 10 characters)");
      return;
    }

    setReturning(true);
    try {
      const response = await fetch(`/api/goal-sheets/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: returnComment,
          quarter: returnQuarter,
        }),
      });

      if (response.ok) {
        toast.success("Goal sheet returned for revision");
        setShowReturnModal(false);
        router.push("/manager");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to return goal sheet");
      }
    } catch (error) {
      console.error("Error returning:", error);
      toast.error("An error occurred while returning goal sheet");
    } finally {
      setReturning(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditError("");
    setEditValues((prev) => ({
      ...prev,
      [goal.id]: {
        target: goal.target.toString(),
        weightage: goal.weightage.toString(),
      },
    }));
  };

  const handleSaveGoalEdit = async (goalId: string) => {
    setSavingGoal(goalId);
    setEditError("");
    try {
      const values = editValues[goalId];
      const weightage = parseFloat(values.weightage);

      if (isNaN(weightage)) {
        setEditError("Invalid weightage value");
        return;
      }

      if (weightage < 10 || weightage > 100) {
        setEditError("Weightage must be between 10 and 100");
        return;
      }

      // Check total weightage across all goals with proposed value
      const othersTotal = goals
        .filter((g) => g.id !== goalId)
        .reduce((s, g) => s + g.weightage, 0);
      const proposedTotal = othersTotal + weightage;

      if (Math.abs(proposedTotal - 100) > 0.01) {
        setEditError(
          `Total weightage would be ${proposedTotal.toFixed(1)}%. Must equal 100%.`
        );
        return;
      }

      const response = await fetch(
        `/api/goals/${goalId}/edit-during-approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target: values.target,
            weightage,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
        setEditingGoalId(null);
        setEditError("");
      } else {
        const error = await response.json();
        setEditError(error.error || "Failed to update goal");
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      setEditError("An error occurred while saving goal");
    } finally {
      setSavingGoal(null);
    }
  };

  const handleEditChange = (
    goalId: string,
    field: "target" | "weightage",
    value: string
  ) => {
    setEditError("");
    setEditValues((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!goalSheet) {
    return <div className="p-6">Goal sheet not found</div>;
  }

  const isLocked = goalSheet.status === "LOCKED";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Goal Sheet</h1>
          <p className="text-gray-600 mt-1">
            Employee: {(goalSheet as any).employee?.name}
          </p>
        </div>
        <StatusBadge status={goalSheet.status} type="goal-sheet" />
      </div>

      {/* Weightage summary */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
          weightageOk
            ? "bg-green-50 border border-green-200"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        {weightageOk ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        )}
        <p
          className={`text-sm font-medium ${
            weightageOk ? "text-green-700" : "text-amber-700"
          }`}
        >
          Total Weightage: {totalWeightage.toFixed(1)}%
          {!weightageOk && " — must equal 100% before approving"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Goals Review ({goals.length} goals)
          </h2>
        </CardHeader>
        <CardBody>
          {editError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {editError}
            </div>
          )}
          <Table>
            <Thead>
              <Tr>
                <Th>Goal</Th>
                <Th>Thrust Area</Th>
                <Th>Target</Th>
                <Th>Weightage</Th>
                <Th>UoM</Th>
                {!isLocked && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {goals.map((goal) => (
                <Tr key={goal.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-gray-900">{goal.title}</p>
                      {goal.isShared && goal.sharedFromId && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full ml-2">
                          <Share2 className="w-3 h-3" />
                          Shared
                        </span>
                      )}
                      {goal.isShared && !goal.sharedFromId && (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full ml-2">
                          Archived Shared
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>{goal.thrustArea}</Td>
                  <Td>
                    {editingGoalId === goal.id ? (
                      <Input
                        type="text"
                        value={editValues[goal.id]?.target ?? goal.target}
                        onChange={(e) =>
                          handleEditChange(goal.id, "target", e.target.value)
                        }
                        className="w-32 text-sm px-3 py-1.5"
                      />
                    ) : (
                      goal.target
                    )}
                  </Td>
                  <Td>
                    {editingGoalId === goal.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="10"
                          max="100"
                          step="5"
                          value={editValues[goal.id]?.weightage ?? goal.weightage}
                          onChange={(e) =>
                            handleEditChange(
                              goal.id,
                              "weightage",
                              e.target.value
                            )
                          }
                          className="w-24 text-sm px-3 py-1.5"
                        />
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    ) : (
                      <span
                        className={`font-medium ${
                          !weightageOk ? "text-amber-600" : "text-gray-900"
                        }`}
                      >
                        {goal.weightage}%
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {goal.uom?.replace("_", " ")}
                    </span>
                  </Td>
                  {!isLocked && (
                    <Td>
                      {editingGoalId === goal.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveGoalEdit(goal.id)}
                            loading={savingGoal === goal.id}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingGoalId(null);
                              setEditError("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditGoal(goal)}
                        >
                          Edit
                        </Button>
                      )}
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {!isLocked && (
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleApprove}
            loading={approving}
            disabled={!weightageOk}
          >
            {weightageOk
              ? "Approve & Lock Goal Sheet"
              : `Fix Weightage (${totalWeightage.toFixed(1)}%) to Approve`}
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowReturnModal(true)}
            loading={returning}
          >
            Return for Revision
          </Button>
        </div>
      )}

      {isLocked && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">
            This goal sheet has been approved and locked.
          </p>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 space-y-4 w-[480px] shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Return for Revision
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
              </label>
              <Select
                value={returnQuarter}
                onChange={(e) => setReturnQuarter(e.target.value)}
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Return{" "}
                <span className="text-gray-400">(min 10 characters)</span>
              </label>
              <Textarea
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                placeholder="Explain why this goal sheet is being returned..."
                rows={4}
              />
              <p className="text-gray-500 text-xs mt-1">
                {returnComment.length} characters{" "}
                {returnComment.length < 10 && `(need ${10 - returnComment.length} more)`}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReturn}
                loading={returning}
                disabled={returnComment.length < 10}
              >
                Confirm Return
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
