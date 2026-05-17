"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Share2, Users } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

interface SharedGoalRow {
  id: string;
  title: string;
  thrustArea: string;
  target: string;
  uom: string;
  createdAt: string;
  createdBy: { name: string };
  goals: Array<{
    id: string;
    goalSheet: { employee: { id: string; name: string } };
  }>;
}

export default function SharedGoalsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [sharedGoals, setSharedGoals] = useState<SharedGoalRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    thrustArea: "",
    target: "",
    uom: "NUMERIC_MAX",
    assignToEmployeeIds: [] as string[],
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([fetchSharedGoals(), fetchEmployees()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchSharedGoals = async () => {
    try {
      const res = await fetch("/api/shared-goals");
      const data = await res.json();
      setSharedGoals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching shared goals:", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      // Only employees
      const emps = (Array.isArray(data) ? data : []).filter(
        (u: any) => u.role === "EMPLOYEE"
      );
      setEmployees(emps);
    } catch (e) {
      console.error("Error fetching employees:", e);
    }
  };

  const toggleEmployee = (empId: string) => {
    setForm((prev) => ({
      ...prev,
      assignToEmployeeIds: prev.assignToEmployeeIds.includes(empId)
        ? prev.assignToEmployeeIds.filter((id) => id !== empId)
        : [...prev.assignToEmployeeIds, empId],
    }));
  };

  const handleCreate = async () => {
    setFormError("");
    if (!form.title.trim() || !form.thrustArea.trim() || !form.target.trim()) {
      setFormError("Title, Thrust Area, and Target are required.");
      return;
    }
    if (form.assignToEmployeeIds.length === 0) {
      setFormError("Select at least one employee to assign this goal to.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await fetchSharedGoals();
        setShowForm(false);
        setForm({
          title: "",
          thrustArea: "",
          target: "",
          uom: "NUMERIC_MAX",
          assignToEmployeeIds: [],
        });
      } else {
        const err = await res.json();
        setFormError(err.error || "Failed to create shared goal.");
      }
    } catch (e) {
      setFormError("An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shared goal? This will remove it from all employees."))
      return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/shared-goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSharedGoals((prev) => prev.filter((g) => g.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete shared goal.");
      }
    } catch (e) {
      alert("An error occurred.");
    } finally {
      setDeleting(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Shared Goals</h1>
          <p className="text-gray-600 mt-1">
            Create goals assigned to multiple employees
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Shared Goal
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              New Shared Goal
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Reduce customer complaints"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thrust Area *
                </label>
                <input
                  type="text"
                  value={form.thrustArea}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, thrustArea: e.target.value }))
                  }
                  placeholder="e.g., Customer Experience"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target *
                </label>
                <input
                  type="text"
                  value={form.target}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, target: e.target.value }))
                  }
                  placeholder="e.g., 95, 2025-12-31"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure *
                </label>
                <select
                  value={form.uom}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, uom: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NUMERIC_MAX">Numeric (Maximize)</option>
                  <option value="NUMERIC_MIN">Numeric (Minimize)</option>
                  <option value="TIMELINE">Timeline</option>
                  <option value="ZERO">Zero/Binary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Assign to Employees *
              </label>
              {employees.length === 0 ? (
                <p className="text-gray-500 text-sm">No employees found.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignToEmployeeIds.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        {emp.name}
                        <span className="text-gray-400 ml-1 text-xs">
                          ({emp.email})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {form.assignToEmployeeIds.length} employee(s) selected
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                onClick={handleCreate}
                loading={creating}
              >
                Create & Assign
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Shared Goals List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Existing Shared Goals ({sharedGoals.length})
          </h2>
        </CardHeader>
        <CardBody>
          {sharedGoals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Share2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No shared goals yet</p>
              <p className="text-sm mt-1">
                Create one to assign it to multiple employees
              </p>
            </div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Thrust Area</Th>
                  <Th>Target</Th>
                  <Th>UoM</Th>
                  <Th>Assigned To</Th>
                  <Th>Created By</Th>
                  <Th>Created</Th>
                  {role === "ADMIN" && <Th>Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {sharedGoals.map((sg) => (
                  <Tr key={sg.id}>
                    <Td>
                      <span className="font-medium text-gray-900">
                        {sg.title}
                      </span>
                      <Badge variant="approved" className="ml-2 text-xs">
                        Shared
                      </Badge>
                    </Td>
                    <Td>{sg.thrustArea}</Td>
                    <Td>{sg.target}</Td>
                    <Td>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {sg.uom.replace("_", " ")}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {sg.goals && sg.goals.length > 0 ? (
                          sg.goals.map((g) => (
                            <span
                              key={g.id}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                            >
                              {g.goalSheet?.employee?.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>{sg.createdBy?.name}</Td>
                    <Td>{formatDate(sg.createdAt)}</Td>
                    {role === "ADMIN" && (
                      <Td>
                        <button
                          onClick={() => handleDelete(sg.id)}
                          disabled={deleting === sg.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Delete shared goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
