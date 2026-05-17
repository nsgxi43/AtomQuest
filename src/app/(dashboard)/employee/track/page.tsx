"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { Goal, QuarterlyUpdate } from "@/types";

type UpdateState = Record<string, { actualAchievement: string; status: "NOT_STARTED" | "ON_TRACK" | "COMPLETED" }>;

export default function QuarterlyTrackingPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [updates, setUpdates] = useState<QuarterlyUpdate[]>([]);
  const [activeQuarter, setActiveQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>({});
  const quarters: ("Q1" | "Q2" | "Q3" | "Q4")[] = ["Q1", "Q2", "Q3", "Q4"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const goalsRes = await fetch("/api/goals");
        const goalsData = await goalsRes.json();
        setGoals(goalsData.goals || []);

        const updatesRes = await fetch("/api/quarterly-updates");
        const updatesData = await updatesRes.json();
        setUpdates(updatesData || []);

        // Initialize updateState from fetched data
        const state: UpdateState = {};
        (goalsData.goals || []).forEach((goal: Goal) => {
          const update = (updatesData || []).find(
            (u: QuarterlyUpdate) => u.goalId === goal.id
          );
          state[goal.id] = {
            actualAchievement: update?.actualAchievement || "",
            status: update?.status || "NOT_STARTED",
          };
        });
        setUpdateState(state);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleActualChange = (goalId: string, value: string) => {
    setUpdateState((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        actualAchievement: value,
      },
    }));
  };

  const handleStatusChange = (
    goalId: string,
    status: "NOT_STARTED" | "ON_TRACK" | "COMPLETED"
  ) => {
    setUpdateState((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        status,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(updateState).map(([goalId, data]) =>
        fetch("/api/quarterly-updates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId,
            quarter: activeQuarter,
            actualAchievement: data.actualAchievement,
            status: data.status,
          }),
        })
      );

      const results = await Promise.all(updates);
      const hasErrors = results.some((res) => !res.ok);

      if (hasErrors) {
        alert("Some updates failed. Please try again.");
      } else {
        alert("All updates saved successfully!");
        // Refresh data
        const updatesRes = await fetch("/api/quarterly-updates");
        const updatesData = await updatesRes.json();
        setUpdates(updatesData || []);
      }
    } catch (error) {
      console.error("Error saving updates:", error);
      alert("Failed to save updates");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quarterly Tracking</h1>
        <p className="text-gray-600 mt-1">Track goal progress by quarter</p>
      </div>

      <div className="flex gap-2 bg-white p-4 rounded-lg">
        {quarters.map((q) => (
          <Button
            key={q}
            variant={activeQuarter === q ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveQuarter(q)}
          >
            {q}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{activeQuarter} Progress</h2>
        </CardHeader>
        <CardBody>
          <Table>
            <Thead>
              <Tr>
                <Th>Goal</Th>
                <Th>Target</Th>
                <Th>Actual</Th>
                <Th>Score</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {goals.map((goal) => {
                const stateData = updateState[goal.id];
                const update = updates.find(
                  (u) => u.goalId === goal.id && u.quarter === activeQuarter
                );
                return (
                  <Tr key={goal.id}>
                    <Td>{goal.title}</Td>
                    <Td>{goal.target}</Td>
                    <Td>
                      <input
                        type="text"
                        value={stateData?.actualAchievement || ""}
                        onChange={(e) =>
                          handleActualChange(goal.id, e.target.value)
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter value"
                      />
                    </Td>
                    <Td>
                      {update?.computedScore ? (
                        <ScoreBar score={update.computedScore} />
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </Td>
                    <Td>
                      <select
                        value={stateData?.status || "NOT_STARTED"}
                        onChange={(e) =>
                          handleStatusChange(
                            goal.id,
                            e.target.value as "NOT_STARTED" | "ON_TRACK" | "COMPLETED"
                          )
                        }
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="ON_TRACK">On Track</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Button
        variant="primary"
        onClick={handleSave}
        loading={saving}
        disabled={goals.length === 0}
      >
        Save Progress
      </Button>
    </div>
  );
}
