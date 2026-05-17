"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { GoalSheet, Goal } from "@/types";

interface ManagerApprovePageProps {
  params: {
    id: string;
  };
}

export default function ManagerApprovePage({
  params,
}: ManagerApprovePageProps) {
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
  const [editValues, setEditValues] = useState<Record<string, { target: string; weightage: string }>>({});
  const [savingGoal, setSavingGoal] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoalSheet = async () => {
      try {
        const response = await fetch(`/api/goal-sheets/${params.id}`);
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
  }, [params.id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const response = await fetch(`/api/goal-sheets/${params.id}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        setGoalSheet((prev) =>
          prev ? { ...prev, status: "LOCKED" } : null
        );
        alert("Goal sheet approved successfully");
        router.push("/manager");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to approve goal sheet");
      }
    } catch (error) {
      console.error("Error approving:", error);
      alert("An error occurred while approving");
    } finally {
      setApproving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnComment || returnComment.length < 10) {
      alert("Please provide a return reason (min 10 characters)");
      return;
    }

    setReturning(true);
    try {
      const response = await fetch(`/api/goal-sheets/${params.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: returnComment,
          quarter: returnQuarter,
        }),
      });

      if (response.ok) {
        alert("Goal sheet returned for revision");
        setShowReturnModal(false);
        router.push("/manager");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to return goal sheet");
      }
    } catch (error) {
      console.error("Error returning:", error);
      alert("An error occurred while returning goal sheet");
    } finally {
      setReturning(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditValues({
      [goal.id]: {
        target: goal.target.toString(),
        weightage: goal.weightage.toString(),
      },
    });
  };

  const handleSaveGoalEdit = async (goalId: string) => {
    setSavingGoal(goalId);
    try {
      const values = editValues[goalId];
      const target = parseFloat(values.target);
      const weightage = parseFloat(values.weightage);

      if (isNaN(target) || isNaN(weightage)) {
        alert("Invalid target or weightage value");
        return;
      }

      if (weightage < 10 || weightage > 100) {
        alert("Weightage must be between 10 and 100");
        return;
      }

      const response = await fetch(
        `/api/goals/${goalId}/edit-during-approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target, weightage }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? updated : g))
        );
        setEditingGoalId(null);
        alert("Goal updated successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update goal");
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("An error occurred while saving goal");
    } finally {
      setSavingGoal(null);
    }
  };

  const handleEditChange = (goalId: string, field: "target" | "weightage", value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!goalSheet) {
    return <div className="p-6">Goal sheet not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Goal Sheet</h1>
        <p className="text-gray-600 mt-1">Employee: {goalSheet.employee?.name}</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Goals Review</h2>
        </CardHeader>
        <CardBody>
          <Table>
            <Thead>
              <Tr>
                <Th>Goal</Th>
                <Th>Thrust Area</Th>
                <Th>Target</Th>
                <Th>Weightage</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {goals.map((goal) => (
                <Tr key={goal.id}>
                  <Td>{goal.title}</Td>
                  <Td>{goal.thrustArea}</Td>
                  <Td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="text"
                        value={editValues[goal.id]?.target || goal.target}
                        onChange={(e) =>
                          handleEditChange(goal.id, "target", e.target.value)
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      goal.target
                    )}
                  </Td>
                  <Td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="text"
                        value={editValues[goal.id]?.weightage || goal.weightage}
                        onChange={(e) =>
                          handleEditChange(goal.id, "weightage", e.target.value)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      `${goal.weightage}%`
                    )}
                  </Td>
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
                          onClick={() => setEditingGoalId(null)}
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
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" onClick={handleApprove} loading={approving}>
          Approve Goal Sheet
        </Button>
        <Button
          variant="danger"
          onClick={() => setShowReturnModal(true)}
          loading={returning}
        >
          Return for Revision
        </Button>
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 space-y-4 w-96">
            <h2 className="text-lg font-semibold">Return for Revision</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
              </label>
              <select
                value={returnQuarter}
                onChange={(e) => setReturnQuarter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Return (min 10 characters)
              </label>
              <textarea
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                placeholder="Explain why this goal sheet is being returned..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-32"
              />
              <p className="text-gray-600 text-sm mt-1">
                Characters: {returnComment.length}
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
