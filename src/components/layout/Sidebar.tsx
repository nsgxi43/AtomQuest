"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  BarChart3,
} from "lucide-react";
import { Button } from "../ui/Button";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;

  const isActive = (href: string) => pathname.startsWith(href);

  const links = [
    role === "EMPLOYEE" && { href: "/employee", label: "Goals", icon: FileText },
    role === "EMPLOYEE" && {
      href: "/employee/track",
      label: "Quarterly Tracking",
      icon: BarChart3,
    },
    role === "MANAGER" && { href: "/manager", label: "Team", icon: Users },
    role === "MANAGER" && {
      href: "/manager/checkin",
      label: "Check-ins",
      icon: FileText,
    },
    role === "ADMIN" && {
      href: "/admin",
      label: "Settings",
      icon: LayoutDashboard,
    },
    role === "ADMIN" && { href: "/admin/users", label: "Users", icon: Users },
    role === "ADMIN" && {
      href: "/admin/audit",
      label: "Audit",
      icon: FileText,
    },
    role === "MANAGER" || role === "ADMIN"
      ? { href: "/reports", label: "Reports", icon: BarChart3 }
      : null,
  ].filter(Boolean);

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">AtomQuest</h1>
        <p className="text-gray-400 text-sm mt-1">{role?.toUpperCase()}</p>
      </div>

      <nav className="flex-1 px-3 py-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors",
              isActive(link.href)
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            )}
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:text-white"
          onClick={() => signOut({ redirect: true, redirectTo: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
