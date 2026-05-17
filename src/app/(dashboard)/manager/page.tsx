"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import { User, GoalSheet } from "@/types";

interface EmployeeWithGoalSheet {
  id: string;
  name: string;
  email: string;
  goalSheets: GoalSheet[];
}

export default function ManagerPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<EmployeeWithGoalSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
        <p className="text-gray-600 mt-1">
          Manage goals for {employees.length} direct report(s)
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Direct Reports
          </h2>
        </CardHeader>
        <CardBody>
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Goal Sheet Status</Th>
                <Th>Submitted Date</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {employees.map((emp) => {
                const latestGoalSheet = emp.goalSheets?.[0];
                return (
                  <Tr key={emp.id}>
                    <Td>{emp.name}</Td>
                    <Td>{emp.email}</Td>
                    <Td>
                      {latestGoalSheet ? (
                        <StatusBadge
                          status={latestGoalSheet.status}
                          type="goal-sheet"
                        />
                      ) : (
                        <span className="text-gray-500">No goal sheet</span>
                      )}
                    </Td>
                    <Td>
                      {latestGoalSheet?.submittedAt
                        ? formatDate(latestGoalSheet.submittedAt)
                        : "-"}
                    </Td>
                    <Td>
                      {latestGoalSheet && (
                        <Link
                          href={`/manager/approve/${latestGoalSheet.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Review
                        </Link>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
