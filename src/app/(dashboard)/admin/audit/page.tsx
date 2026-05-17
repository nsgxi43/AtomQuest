"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

interface AuditLogRow {
  id: string;
  entityType: string;
  entityId: string;
  changeDescription: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedBy: { name: string; email: string; role: string };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/audit-logs");
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Track all system changes — last 100 events</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            System Changes ({logs.length})
          </h2>
        </CardHeader>
        <CardBody>
          {logs.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">No audit logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Actor</Th>
                    <Th>Entity</Th>
                    <Th>Action</Th>
                    <Th>Old Value</Th>
                    <Th>New Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {logs.map((log) => (
                    <Tr key={log.id}>
                      <Td>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.changedAt)}
                        </span>
                      </Td>
                      <Td>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {log.changedBy?.name ?? "System"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {log.changedBy?.role}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {log.entityType}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-sm text-gray-800">
                          {log.changeDescription}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-xs text-gray-500">
                          {log.oldValue || "-"}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-xs text-gray-700 font-medium">
                          {log.newValue || "-"}
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
