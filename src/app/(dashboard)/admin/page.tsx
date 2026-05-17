"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Cycle Configuration</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Cycle Year
            </label>
            <input
              type="number"
              defaultValue={new Date().getFullYear()}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Configuration
          </button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </CardHeader>
        <CardBody className="space-y-2">
          <button className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded">
            Manage Users
          </button>
          <button className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded">
            View Audit Logs
          </button>
          <button className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded">
            Goal Sheet Management
          </button>
        </CardBody>
      </Card>
    </div>
  );
}
