"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, Filter } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

interface ReportRow {
  employeeId: string;
  employee: string;
  email: string;
  goalId: string;
  goal: string;
  thrustArea: string;
  uom: string;
  target: string;
  weightage: number;
  isShared: boolean;
  quarter: string;
  actual: string;
  score: number;
  status: "NOT_STARTED" | "ON_TRACK" | "COMPLETED";
  cycleYear: number;
}

interface DashboardStats {
  totalEmployees: number;
  submitted: number;
  approved: number;
  locked: number;
  draft: number;
  returned: number;
  avgScore: number;
  quarterlyStats: Record<
    string,
    { completed: number; onTrack: number; notStarted: number }
  >;
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  ON_TRACK: "bg-blue-100 text-blue-800",
  NOT_STARTED: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completed",
  ON_TRACK: "On Track",
  NOT_STARTED: "Not Started",
};

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quarterFilter, setQuarterFilter] = useState("");

  const fetchData = useCallback(async (q?: string) => {
    try {
      const params = q ? `?quarter=${q}` : "";
      const [reportRes, statsRes] = await Promise.all([
        fetch(`/api/reports${params}`),
        fetch("/api/dashboard/stats"),
      ]);
      const [reportData, statsData] = await Promise.all([
        reportRes.json(),
        statsRes.json(),
      ]);
      setRows(Array.isArray(reportData) ? reportData : []);
      setStats(statsData);
    } catch (e) {
      console.error("Error fetching report data:", e);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleFilter = async () => {
    setRefreshing(true);
    await fetchData(quarterFilter || undefined);
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee",
      "Email",
      "Goal",
      "Thrust Area",
      "UoM",
      "Target",
      "Weightage (%)",
      "Quarter",
      "Actual",
      "Score (%)",
      "Status",
      "Cycle Year",
      "Shared",
    ];

    const csvRows = [
      headers,
      ...rows.map((r) => [
        r.employee,
        r.email,
        `"${r.goal.replace(/"/g, '""')}"`,
        r.thrustArea,
        r.uom,
        r.target,
        r.weightage,
        r.quarter,
        r.actual,
        r.score.toFixed(1),
        STATUS_LABEL[r.status] ?? r.status,
        r.cycleYear,
        r.isShared ? "Yes" : "No",
      ]),
    ];

    const csv = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `achievement-report${quarterFilter ? `-${quarterFilter}` : ""}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Real-time achievement and completion metrics
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center gap-2"
          disabled={rows.length === 0}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Completion Dashboard */}
      {stats && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Completion Dashboard
          </h2>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Goal Sheets Submitted"
              value={stats.submitted}
              total={stats.totalEmployees}
              color="blue"
            />
            <StatCard
              label="Approved & Locked"
              value={stats.locked}
              total={stats.totalEmployees}
              color="green"
            />
            <StatCard
              label="Pending Approval"
              value={stats.approved - stats.locked}
              total={stats.totalEmployees}
              color="yellow"
            />
            <StatCard
              label="Avg Score"
              value={stats.avgScore}
              suffix="%"
              color="purple"
            />
          </div>

          {/* Quarterly breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quarters.map((q) => {
              const qs = stats.quarterlyStats[q] ?? {
                completed: 0,
                onTrack: 0,
                notStarted: 0,
              };
              return (
                <Card key={q}>
                  <CardBody className="p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      {q} Status
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-600 font-medium">
                          Completed
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          {qs.completed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600 font-medium">
                          On Track
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          {qs.onTrack}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium">
                          Not Started
                        </span>
                        <span className="text-sm font-bold text-gray-600">
                          {qs.notStarted}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {stats.locked > 0 && (
                      <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (qs.completed / stats.locked) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievement Report */}
      <Card>
        <CardHeader className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Achievement Report
            {rows.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({rows.length} rows)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Quarters</option>
              {quarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFilter}
              loading={refreshing}
              className="flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />
              Filter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuarterFilter("");
                setRefreshing(true);
                fetchData().finally(() => setRefreshing(false));
              }}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {rows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium">No report data available</p>
              <p className="text-sm mt-1">
                Data appears once goal sheets are approved and quarterly
                tracking begins
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Employee</Th>
                    <Th>Goal</Th>
                    <Th>Thrust Area</Th>
                    <Th>Target</Th>
                    <Th>Quarter</Th>
                    <Th>Actual</Th>
                    <Th>Score</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row, idx) => (
                    <Tr key={`${row.goalId}-${row.quarter}-${idx}`}>
                      <Td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {row.employee}
                          </p>
                          <p className="text-xs text-gray-500">{row.email}</p>
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <p className="font-medium text-gray-900 max-w-xs truncate">
                            {row.goal}
                          </p>
                          {row.isShared && (
                            <Badge variant="approved" className="text-xs mt-0.5">
                              Shared
                            </Badge>
                          )}
                        </div>
                      </Td>
                      <Td>{row.thrustArea}</Td>
                      <Td>{row.target}</Td>
                      <Td>
                        <span className="text-sm font-medium text-blue-600">
                          {row.quarter}
                        </span>
                      </Td>
                      <Td>{row.actual}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, row.score)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-700">
                            {row.score.toFixed(1)}%
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[row.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {STATUS_LABEL[row.status] ?? row.status}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  suffix = "",
  color,
}: {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
  color: "blue" | "green" | "yellow" | "purple" | "gray";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colors[color]}`}
    >
      <p className="text-3xl font-bold">
        {value}
        {suffix}
      </p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
      {total !== undefined && (
        <p className="text-xs mt-1 opacity-60">out of {total} employees</p>
      )}
    </div>
  );
}
