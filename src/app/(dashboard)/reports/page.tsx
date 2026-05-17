"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const handleExportCSV = () => {
    const data = [
      ["Employee", "Goal", "Thrust Area", "Target", "Actual", "Score", "Status"],
      ["John Doe", "Implement Feature", "Technology", "100", "95", "95%", "On Track"],
    ];

    const csv = data.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "achievement-report.csv";
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View achievement and completion metrics</p>
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Achievement Report</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardBody>
          <Table>
            <Thead>
              <Tr>
                <Th>Employee</Th>
                <Th>Goal</Th>
                <Th>Thrust Area</Th>
                <Th>Target</Th>
                <Th>Actual</Th>
                <Th>Score</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Employee User</Td>
                <Td>Sample Goal</Td>
                <Td>Technology</Td>
                <Td>100</Td>
                <Td>-</Td>
                <Td>-</Td>
                <Td>Not Started</Td>
              </Tr>
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Completion Summary</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">1</p>
              <p className="text-sm text-gray-600">Goals Submitted</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">1</p>
              <p className="text-sm text-gray-600">Goals Approved</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">0</p>
              <p className="text-sm text-gray-600">Q1 Completed</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">0%</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
