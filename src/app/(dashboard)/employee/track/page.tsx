"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, Share2, Lock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Goal, QuarterlyUpdate } from "@/types";
import { calculateGoalProgress } from "@/lib/utils";
import { getCycleStatus, getQuarterState, getQuarterMessage, Quarter } from "@/lib/cycle";

type UpdateState = Record<
  string,
  {
    actualAchievement: string;
    status: "NOT_STARTED" | "ON_TRACK" | "COMPLETED" | "DELAYED" | "AT_RISK";
  }
>;

export default function QuarterlyTrackingPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [updates, setUpdates] = useState<QuarterlyUpdate[]>([]);
  const [activeQuarter, setActiveQuarter] = useState<
    "Q1" | "Q2" | "Q3" | "Q4"
  >("Q1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [updateState, setUpdateState] = useState<UpdateState>({});
  const quarters: ("Q1" | "Q2" | "Q3" | "Q4")[] = ["Q1", "Q2", "Q3", "Q4"];

  const fetchUpdates = async () => {
    const updatesRes = await fetch("/api/quarterly-updates");
    const updatesData = await updatesRes.json();
    return updatesData || [];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const goalsRes = await fetch("/api/goals");
        const goalsData = await goalsRes.json();
        const goalsList: Goal[] = goalsData.goals || [];
        setGoals(goalsList);

        const updatesData = await fetchUpdates();
        setUpdates(updatesData);

        // Initialize updateState from persisted data for active quarter
        const state: UpdateState = {};
        goalsList.forEach((goal: Goal) => {
          const update = updatesData.find(
            (u: QuarterlyUpdate) =>
              u.goalId === goal.id && u.quarter === activeQuarter
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When quarter changes, re-initialise the form state from saved updates
  useEffect(() => {
    const state: UpdateState = {};
    goals.forEach((goal) => {
      const update = updates.find(
        (u) => u.goalId === goal.id && u.quarter === activeQuarter
      );
      state[goal.id] = {
        actualAchievement: update?.actualAchievement || "",
        status: update?.status || "NOT_STARTED",
      };
    });
    setUpdateState(state);
  }, [activeQuarter, updates, goals]);

  const handleActualChange = (goalId: string, value: string) => {
    setUpdateState((prev) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return prev;
      const { status: newStatus } = calculateGoalProgress(goal.uom, goal.target, value);

      return {
        ...prev,
        [goalId]: {
          ...prev[goalId],
          actualAchievement: value,
          status: newStatus,
        },
      };
    });
  };

  /**
   * Save a single goal's update.
   * If the goal is a shared goal, also trigger sync across all linked goals.
   */
  const saveSingleGoal = async (goal: Goal) => {
    const data = updateState[goal.id];
    const res = await fetch("/api/quarterly-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId: goal.id,
        quarter: activeQuarter,
        actualAchievement: data.actualAchievement,
        status: data.status,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save update");
    }

    // If shared goal, sync achievement to all linked employee goals
    if (goal.isShared && goal.sharedFromId) {
      setSyncing(goal.id);
      try {
        await fetch("/api/shared-goals/sync-achievement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sharedGoalId: goal.sharedFromId,
            quarter: activeQuarter,
            actualAchievement: data.actualAchievement,
            status: data.status,
          }),
        });
      } finally {
        setSyncing(null);
      }
    }

    return res.json();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const results = await Promise.allSettled(goals.map(saveSingleGoal));
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        alert(`${failed.length} update(s) failed. Please try again.`);
      } else {
        alert("All updates saved successfully!");
        const updatesData = await fetchUpdates();
        setUpdates(updatesData);
      }
    } catch (error) {
      console.error("Error saving updates:", error);
      alert("Failed to save updates");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quarterly Tracking</h1>
          <p className="text-gray-600 mt-1">Track goal progress by quarter</p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
          {getCycleStatus().message}
        </div>
      </div>

      <div className="flex gap-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        {quarters.map((q) => {
          const state = getQuarterState(q as Quarter);
          const isFuture = state === "LOCKED_FUTURE";
          const message = getQuarterMessage(q as Quarter);

          return (
            <div key={q} className="relative group">
              <Button
                variant={activeQuarter === q ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  if (!isFuture) setActiveQuarter(q);
                }}
                disabled={isFuture}
                className={isFuture ? "opacity-50 cursor-not-allowed flex items-center gap-1" : "flex items-center gap-1"}
              >
                {q}
                {isFuture && <Lock className="w-3 h-3" />}
              </Button>
              {/* Tooltip for Quarter Message */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-xs bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                {message}
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{activeQuarter} Progress</h2>
        </CardHeader>
        <CardBody>
          {goals.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">
              No approved goals to track. Goals appear here after your goal
              sheet is approved.
            </p>
          ) : (
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
                    (u) =>
                      u.goalId === goal.id && u.quarter === activeQuarter
                  );
                  return (
                    <Tr key={goal.id}>
                      <Td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {goal.title}
                          </p>
                          {goal.isShared && (
                            <span className="inline-flex items-center gap-1 text-xs text-purple-600 mt-0.5">
                              <Share2 className="w-3 h-3" />
                              Shared
                              {syncing === goal.id && (
                                <span className="ml-1 text-blue-500">
                                  (syncing…)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>{goal.target}</Td>
                      <Td>
                        <input
                          type={goal.uom === "TIMELINE" ? "date" : "text"}
                          value={stateData?.actualAchievement || ""}
                          onChange={(e) =>
                            handleActualChange(goal.id, e.target.value)
                          }
                          className="w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                          placeholder={goal.uom === "TIMELINE" ? "YYYY-MM-DD" : "Enter value"}
                          disabled={getQuarterState(activeQuarter as Quarter) !== "ACTIVE"}
                        />
                      </Td>
                      <Td>
                        {update?.computedScore != null ? (
                          <ScoreBar score={update.computedScore} />
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={stateData?.status || "NOT_STARTED"} type="update" />
                          {goal.uom === "TIMELINE" && stateData?.actualAchievement && calculateGoalProgress(goal.uom, goal.target, stateData.actualAchievement).lateCompletion && (
                            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Late</span>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {getQuarterState(activeQuarter as Quarter) === "LOCKED_PAST" && goals.length > 0 && (
        <div className="bg-gray-50 text-gray-800 p-4 rounded-lg text-sm border border-gray-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          {activeQuarter} is historical and read-only. Editing is disabled.
        </div>
      )}
      {getQuarterState(activeQuarter as Quarter) === "LOCKED_FUTURE" && goals.length > 0 && (
        <div className="bg-gray-50 text-gray-800 p-4 rounded-lg text-sm border border-gray-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          {getQuarterMessage(activeQuarter as Quarter)}
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleSave}
        loading={saving}
        disabled={goals.length === 0 || getQuarterState(activeQuarter as Quarter) !== "ACTIVE"}
        className="flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Save Progress
        {goals.some((g) => g.isShared) && (
          <span className="text-xs opacity-75 ml-1">
            (shared goals will sync)
          </span>
        )}
      </Button>
    </div>
  );
}
