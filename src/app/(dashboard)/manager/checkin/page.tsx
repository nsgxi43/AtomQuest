"use client";
import { useState, useEffect } from "react";

import { MessageSquare, Lock, Share2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, calculateGoalProgress } from "@/lib/utils";
import { getCycleStatus, getQuarterState, getQuarterMessage, Quarter } from "@/lib/cycle";
import { getEffectiveDateClient } from "@/lib/cycle-client";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Goal {
  id: string;
  title: string;
  thrustArea: string;
  target: string;
  weightage: number;
  uom: string;
  isShared: boolean;
  isPrimaryOwner: boolean;
  sharedFromId?: string | null;
}

interface QuarterlyUpdate {
  goalId: string;
  quarter: string;
  actualAchievement: string | null;
  status: string;
  computedScore: number | null;
}

interface CheckinComment {
  id: string;
  quarter: string;
  comment: string;
  createdAt: string;
  manager: { name: string };
}

interface GoalSheetData {
  id: string;
  goals: Goal[];
  checkins: CheckinComment[];
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

export default function ManagerCheckInPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>("Q1");
  const [goalSheet, setGoalSheet] = useState<GoalSheetData | null>(null);
  const [updates, setUpdates] = useState<QuarterlyUpdate[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);

  // Load employees (direct reports)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const effectiveDate = getEffectiveDateClient();

  // Load goal sheet + quarterly updates when employee selected
  useEffect(() => {
    if (!selectedEmployeeId) {
      setGoalSheet(null);
      setUpdates([]);
      return;
    }

    const fetchGoalData = async () => {
      setLoadingGoals(true);
      try {
        // Get goal sheets for this employee
        const gsRes = await fetch(`/api/users/${selectedEmployeeId}/goal-sheets`);
        const gsList = await gsRes.json();
        if (!Array.isArray(gsList) || gsList.length === 0) {
          setGoalSheet(null);
          setUpdates([]);
          return;
        }

        const latestGS = gsList[0];
        // Get full goal sheet with goals + checkins
        const fullRes = await fetch(`/api/goal-sheets/${latestGS.id}`);
        const fullData = await fullRes.json();
        setGoalSheet(fullData);

        // Fetch quarterly updates for this employee's goals
        const updRes = await fetch(`/api/quarterly-updates?goalSheetId=${latestGS.id}`);
        const updData = await updRes.json();
        setUpdates(Array.isArray(updData) ? updData : []);
      } catch (error) {
        console.error("Error fetching goal data:", error);
      } finally {
        setLoadingGoals(false);
      }
    };

    fetchGoalData();
  }, [selectedEmployeeId]);

  const handleSubmit = async () => {
    if (!goalSheet || !comment || comment.length < 10) {
      alert("Please select an employee and enter a comment (min 10 characters)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalSheetId: goalSheet.id,
          quarter: selectedQuarter,
          comment,
        }),
      });

      if (res.ok) {
        alert("Check-in comment saved successfully");
        setComment("");
        // Refresh goal sheet to show new comment
        const fullRes = await fetch(`/api/goal-sheets/${goalSheet.id}`);
        const fullData = await fullRes.json();
        setGoalSheet(fullData);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save check-in");
      }
    } catch (error) {
      console.error("Error saving check-in:", error);
      alert("An error occurred while saving check-in");
    } finally {
      setSubmitting(false);
    }
  };

  const quarterCheckins = goalSheet?.checkins?.filter(
    (c) => c.quarter === selectedQuarter
  ) ?? [];

  const getUpdateForGoal = (goalId: string) =>
    updates.find((u) => u.goalId === goalId && u.quarter === selectedQuarter);

  if (loadingEmployees) {
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
          <h1 className="text-3xl font-bold text-gray-900">Manager Check-in</h1>
          <p className="text-gray-600 mt-1">
            Review progress and provide feedback
          </p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
          {getCycleStatus(effectiveDate).message}
        </div>
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Employee selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setComment("");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          {/* Quarter tabs */}
          {selectedEmployeeId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
              </label>
              <div className="flex gap-2">
                {QUARTERS.map((q) => {
                  const state = getQuarterState(q as Quarter, effectiveDate);
                  const isFuture = state === "LOCKED_FUTURE";
                  const message = getQuarterMessage(q as Quarter, effectiveDate);

                  return (
                    <div key={q} className="relative group">
                      <button
                        onClick={() => {
                          if (!isFuture) setSelectedQuarter(q);
                        }}
                        disabled={isFuture}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedQuarter === q
                            ? "bg-blue-600 text-white"
                            : isFuture
                            ? "bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {q}
                        {isFuture && <Lock className="w-3 h-3" />}
                      </button>
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
            </div>
          )}
        </CardBody>
      </Card>

      {/* Goals table for selected employee + quarter */}
      {selectedEmployeeId && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {selectedQuarter} Goal Progress
              {goalSheet && ` — ${goalSheet.goals.length} goals`}
            </h2>
          </CardHeader>
          <CardBody>
            {loadingGoals ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : !goalSheet ? (
              <p className="text-gray-500 py-4 text-center">
                No goal sheet found for this employee.
              </p>
            ) : goalSheet.goals.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">
                No goals in this goal sheet.
              </p>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Goal</Th>
                    <Th>Thrust Area</Th>
                    <Th>Target</Th>
                    <Th>Weightage</Th>
                    <Th>Actual</Th>
                    <Th>Status</Th>
                    <Th>Score</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {goalSheet.goals.map((goal) => {
                    const upd = getUpdateForGoal(goal.id);
                    return (
                      <Tr key={goal.id}>
                        <Td>
                          <div>
                            <p className="font-medium text-gray-900">{goal.title}</p>
                            {goal.isShared && (
                              <div className="flex items-center gap-1 mt-1">
                                {goal.isPrimaryOwner ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                    Primary KPI Owner
                                  </span>
                                ) : (
                                  <>
                                    {goal.sharedFromId ? (
                                      <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                                        <Share2 className="w-3 h-3" />
                                        Shared
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                        Archived Shared
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                      Managed by Primary Owner
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </Td>
                        <Td>{goal.thrustArea}</Td>
                        <Td>{goal.target}</Td>
                        <Td>{goal.weightage}%</Td>
                        <Td>{upd?.actualAchievement ?? "-"}</Td>
                        <Td>
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={upd?.status ?? "NOT_STARTED"} type="update" />
                            {goal.uom === "TIMELINE" && upd?.actualAchievement && calculateGoalProgress(goal.uom, goal.target, upd.actualAchievement).lateCompletion && (
                              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Late</span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          {upd?.computedScore != null ? (
                            <ScoreBar score={upd.computedScore} />
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* Comment form */}
      {goalSheet && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Add {selectedQuarter} Check-in Comment
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment{" "}
                <span className="text-gray-400">(min 10 characters)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide constructive feedback on goal progress..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                disabled={getQuarterState(selectedQuarter as Quarter, effectiveDate) !== "ACTIVE"}
              />
              <p className="text-gray-500 text-xs mt-1">
                {comment.length} characters
                {comment.length < 10 && ` (need ${10 - comment.length} more)`}
              </p>
            </div>
            {getQuarterState(selectedQuarter as Quarter, effectiveDate) === "LOCKED_PAST" && (
              <div className="bg-gray-50 text-gray-800 p-3 rounded-lg text-sm border border-gray-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                {selectedQuarter} is historical and read-only.
              </div>
            )}
            {getQuarterState(selectedQuarter as Quarter, effectiveDate) === "LOCKED_FUTURE" && (
              <div className="bg-gray-50 text-gray-800 p-3 rounded-lg text-sm border border-gray-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                {getQuarterMessage(selectedQuarter as Quarter, effectiveDate)}
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={comment.length < 10 || getQuarterState(selectedQuarter as Quarter, effectiveDate) !== "ACTIVE"}
            >
              Save Check-in Comment
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Previous comments for selected quarter */}
      {goalSheet && quarterCheckins.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              {selectedQuarter} Comment History ({quarterCheckins.length})
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {quarterCheckins.map((c) => (
              <div
                key={c.id}
                className="border border-gray-100 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {(c as any).manager?.name ?? "Manager"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{c.comment}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
