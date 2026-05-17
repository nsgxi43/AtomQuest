"use client";

import { useSession } from "next-auth/react";
import { Badge } from "../ui/Badge";

export function TopBar() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const roleColors: Record<string, "draft" | "submitted" | "approved" | "returned" | "locked"> = {
    EMPLOYEE: "submitted",
    MANAGER: "approved",
    ADMIN: "locked",
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
      </div>
      <Badge variant={roleColors[user?.role] || "draft"}>
        {user?.role}
      </Badge>
    </div>
  );
}
