"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, GoalSheet } from "@/types";

interface EmployeeWithGoalSheet extends User {
  latestGoalSheet?: GoalSheet;
}

export default function ManagerCheckInPage() {
  const [employees, setEmployees] = useState<EmployeeWithGoalSheet[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedGoalSheetId, setSelectedGoalSheetId] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setSelectedGoalSheetId("");
      return;
    }

    const fetchGoalSheet = async () => {
      try {
        const response = await fetch(
          `/api/users/${selectedEmployeeId}/goal-sheets`
        );
        const goalSheets = await response.json();
        if (goalSheets.length > 0) {
          setSelectedGoalSheetId(goalSheets[0].id);
        }
      } catch (error) {
        console.error("Error fetching goal sheet:", error);
      }
    };

    fetchGoalSheet();
  }, [selectedEmployeeId]);

  const handleSubmit = async () => {
    if (!selectedGoalSheetId || !comment || comment.length < 10) {
      alert(
        "Please select an employee and enter a comment (min 10 characters)"
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalSheetId: selectedGoalSheetId,
          quarter: selectedQuarter,
          comment,
        }),
      });

      if (response.ok) {
        alert("Check-in comment saved successfully");
        setComment("");
        setSelectedEmployeeId("");
        setSelectedGoalSheetId("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save check-in");
      }
    } catch (error) {
      console.error("Error saving check-in:", error);
      alert("An error occurred while saving check-in");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check-in Comments</h1>
        <p className="text-gray-600 mt-1">Provide feedback on goal progress</p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose an employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          {selectedGoalSheetId && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quarter
                </label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
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
                  Check-in Comment (min 10 characters)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Provide constructive feedback on goal progress..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg h-32"
                />
                <p className="text-gray-600 text-sm mt-1">
                  Characters: {comment.length} (minimum 10)
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={comment.length < 10}
              >
                Save Check-in Comment
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
