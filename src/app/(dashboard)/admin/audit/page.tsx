"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import { AuditLog } from "@/types";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/audit-logs");
        const data = await response.json();
        setLogs(data || []);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Track all system changes</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">System Changes</h2>
        </CardHeader>
        <CardBody>
          {logs.length === 0 ? (
            <p className="text-gray-600">No audit logs yet</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Entity Type</Th>
                  <Th>Change Description</Th>
                  <Th>Old Value</Th>
                  <Th>New Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((log) => (
                  <Tr key={log.id}>
                    <Td>{formatDate(log.changedAt)}</Td>
                    <Td>{log.entityType}</Td>
                    <Td>{log.changeDescription}</Td>
                    <Td>{log.oldValue || "-"}</Td>
                    <Td>{log.newValue || "-"}</Td>
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
