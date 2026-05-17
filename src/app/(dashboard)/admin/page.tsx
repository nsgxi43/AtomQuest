"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";

interface GoalSheetRow {
  id: string;
  status: string;
  cycleYear: number;
  lockedAt: string | null;
  approvedAt: string | null;
  employee: { name: string; email: string };
  goals: { id: string }[];
}

export default function AdminPage() {
  const [goalSheets, setGoalSheets] = useState<GoalSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchGoalSheets = async () => {
    try {
      const res = await fetch("/api/admin/goal-sheets");
      const data = await res.json();
      setGoalSheets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching goal sheets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalSheets();
  }, []);

  const handleUnlock = async (id: string) => {
    setUnlocking(id);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/goal-sheets/${id}/unlock`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Goal sheet unlocked. Employee can now edit again.");
        await fetchGoalSheets();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to unlock goal sheet");
      }
    } catch (err) {
      console.error("Error unlocking:", err);
      alert("An error occurred while unlocking");
    } finally {
      setUnlocking(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const locked = goalSheets.filter((gs) => gs.status === "LOCKED");
  const others = goalSheets.filter((gs) => gs.status !== "LOCKED");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin — Goal Sheet Management</h1>
        <p className="text-gray-600 mt-1">View all goal sheets and unlock approved/locked sheets</p>
      </div>

      {/* Locked sheets — unlock action */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold">Locked Goal Sheets ({locked.length})</h2>
        </CardHeader>
        <CardBody>
          {locked.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No locked goal sheets.</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Employee</Th>
                  <Th>Cycle Year</Th>
                  <Th>Goals</Th>
                  <Th>Locked At</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {locked.map((gs) => (
                  <Tr key={gs.id}>
                    <Td>
                      <div>
                        <p className="font-medium text-gray-900">{gs.employee.name}</p>
                        <p className="text-xs text-gray-500">{gs.employee.email}</p>
                      </div>
                    </Td>
                    <Td>{gs.cycleYear}</Td>
                    <Td>{gs.goals.length}</Td>
                    <Td>{gs.lockedAt ? formatDate(gs.lockedAt) : "-"}</Td>
                    <Td>
                      <StatusBadge status={gs.status as any} type="goal-sheet" />
                    </Td>
                    <Td>
                      {confirmId === gs.id ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-amber-600 font-medium">Confirm unlock?</span>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUnlock(gs.id)}
                            loading={unlocking === gs.id}
                          >
                            Yes, Unlock
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmId(gs.id)}
                          className="flex items-center gap-1"
                        >
                          <Unlock className="w-3 h-3" />
                          Unlock
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* All other sheets — read only */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Other Goal Sheets ({others.length})</h2>
        </CardHeader>
        <CardBody>
          {others.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No other goal sheets.</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Employee</Th>
                  <Th>Cycle Year</Th>
                  <Th>Goals</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {others.map((gs) => (
                  <Tr key={gs.id}>
                    <Td>
                      <div>
                        <p className="font-medium text-gray-900">{gs.employee.name}</p>
                        <p className="text-xs text-gray-500">{gs.employee.email}</p>
                      </div>
                    </Td>
                    <Td>{gs.cycleYear}</Td>
                    <Td>{gs.goals.length}</Td>
                    <Td>
                      <StatusBadge status={gs.status as any} type="goal-sheet" />
                    </Td>
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
