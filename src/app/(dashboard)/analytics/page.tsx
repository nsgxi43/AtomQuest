"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { Activity, Users, CheckCircle2, Lock, TrendingUp, BarChart2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface AnalyticsData {
  overview: {
    totalEmployees: number;
    activeGoalSheets: number;
    approvalRate: number;
    quarterlyCompletion: number;
    avgAchievementScore: number;
    lockedSheetsCount: number;
  };
  statusDistribution: { name: string; value: number; fill: string }[];
  quarterTrend: { name: string; score: number }[];
  thrustAreaDistribution: { name: string; value: number }[];
  heatmap: { employee: string; Q1: string; Q2: string; Q3: string; Q4: string }[];
  managerEffectiveness: {
    id: string;
    manager: string;
    teamSize: number;
    approvedSheets: number;
    completedCheckins: number;
    avgTeamScore: number;
  }[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Executive Analytics</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const role = (session?.user as any)?.role;

  const renderBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded bg-green-100 text-green-800">Completed</span>;
      case "ON_TRACK":
        return <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-800">On Track</span>;
      case "NOT_STARTED":
      case "-":
        return <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded bg-gray-100 text-gray-800">Not Started</span>;
      case "DELAYED":
      case "AT_RISK":
        return <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded bg-orange-100 text-orange-800">{status.replace("_", " ")}</span>;
      default:
        return <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-600" />
          Executive Analytics
        </h1>
        <p className="text-gray-500 mt-1">Real-time governance and performance insights for the active cycle.</p>
      </div>

      {/* KPI Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardBody className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 font-medium">Total Employees</p>
                <p className="text-3xl font-bold mt-1">{data.overview.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-200 opacity-80" />
            </div>
            <div className="mt-4 text-sm text-indigo-100">
              {data.overview.activeGoalSheets} Active Goal Sheets
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardBody className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 font-medium">Approval Rate</p>
                <p className="text-3xl font-bold mt-1">{data.overview.approvalRate}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-200 opacity-80" />
            </div>
            <div className="mt-4 text-sm text-emerald-100">
              {data.overview.lockedSheetsCount} Locked Sheets
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <CardBody className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-violet-100 font-medium">Avg Achievement</p>
                <p className="text-3xl font-bold mt-1">{data.overview.avgAchievementScore}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-violet-200 opacity-80" />
            </div>
            <div className="mt-4 text-sm text-violet-100">
              {data.overview.quarterlyCompletion}% Quarterly Completion
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Goal Status Pie Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" /> Goal Status Distribution
            </h3>
          </CardHeader>
          <CardBody className="h-80 flex justify-center items-center">
            {data.statusDistribution.reduce((a, b) => a + b.value, 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${value} Updates`, "Count"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">No data available for current cycle.</p>
            )}
          </CardBody>
        </Card>

        {/* Quarter-wise Trend Line Graph */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" /> Quarter-wise Performance Trend
            </h3>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.quarterTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} domain={[0, 100]} />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}%`, "Avg Score"]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Thrust Area Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-gray-500" /> Thrust Area Distribution
            </h3>
          </CardHeader>
          <CardBody className="h-80">
            {data.thrustAreaDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.thrustAreaDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    angle={-45} 
                    textAnchor="end"
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                  <RechartsTooltip 
                    formatter={(value: any) => [`${value} Goals`, "Count"]}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.thrustAreaDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No data available.</div>
            )}
          </CardBody>
        </Card>

        {/* Quarterly Performance Heatmap */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Quarterly Status Grid</h3>
          </CardHeader>
          <CardBody className="p-0 overflow-auto max-h-[320px]">
            <Table>
              <Thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
                <Tr>
                  <Th>Employee</Th>
                  <Th className="text-center">Q1</Th>
                  <Th className="text-center">Q2</Th>
                  <Th className="text-center">Q3</Th>
                  <Th className="text-center">Q4</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.heatmap.map((emp, i) => (
                  <Tr key={i}>
                    <Td className="font-medium text-gray-900">{emp.employee}</Td>
                    <Td className="text-center">{renderBadge(emp.Q1)}</Td>
                    <Td className="text-center">{renderBadge(emp.Q2)}</Td>
                    <Td className="text-center">{renderBadge(emp.Q3)}</Td>
                    <Td className="text-center">{renderBadge(emp.Q4)}</Td>
                  </Tr>
                ))}
                {data.heatmap.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center py-8 text-gray-500">No data available for current cycle.</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Manager Effectiveness */}
      {role === "ADMIN" && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Manager Effectiveness Analytics</h3>
          </CardHeader>
          <CardBody className="p-0 overflow-auto">
            <Table>
              <Thead>
                <Tr>
                  <Th>Manager</Th>
                  <Th className="text-right">Team Size</Th>
                  <Th className="text-right">Approved Sheets</Th>
                  <Th className="text-right">Completed Check-ins</Th>
                  <Th className="text-right">Avg Team Score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.managerEffectiveness.map((mgr) => (
                  <Tr key={mgr.id}>
                    <Td className="font-medium text-gray-900">{mgr.manager}</Td>
                    <Td className="text-right">{mgr.teamSize}</Td>
                    <Td className="text-right">
                      {mgr.approvedSheets > 0 ? (
                        <span className="text-green-600 font-semibold">{mgr.approvedSheets}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </Td>
                    <Td className="text-right font-medium">{mgr.completedCheckins}</Td>
                    <Td className="text-right">
                      <span className={`inline-flex px-2 py-1 rounded font-bold text-sm ${mgr.avgTeamScore >= 80 ? 'bg-green-100 text-green-800' : mgr.avgTeamScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {mgr.avgTeamScore}%
                      </span>
                    </Td>
                  </Tr>
                ))}
                {data.managerEffectiveness.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center py-8 text-gray-500">No managers found.</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
