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
  Share2,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../ui/Button";
import { signOut } from "next-auth/react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role as string | undefined;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (pathname === href) return true;
    if (href === '/employee' || href === '/manager' || href === '/admin') return false;
    return pathname.startsWith(href);
  };

  const allLinks: Array<NavLink & { roles: string[] }> = [
    { href: "/employee", label: "Goals", icon: FileText, roles: ["EMPLOYEE"] },
    {
      href: "/employee/track",
      label: "Quarterly Tracking",
      icon: BarChart3,
      roles: ["EMPLOYEE"],
    },
    { href: "/manager", label: "Team", icon: Users, roles: ["MANAGER"] },
    {
      href: "/manager/checkin",
      label: "Check-ins",
      icon: FileText,
      roles: ["MANAGER"],
    },
    {
      href: "/admin",
      label: "Settings",
      icon: LayoutDashboard,
      roles: ["ADMIN"],
    },
    { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
    { href: "/admin/audit", label: "Audit", icon: FileText, roles: ["ADMIN"] },
    {
      href: "/shared-goals",
      label: "Shared Goals",
      icon: Share2,
      roles: ["MANAGER", "ADMIN"],
    },
    {
      href: "/reports",
      label: "Reports",
      icon: BarChart3,
      roles: ["MANAGER", "ADMIN"],
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: Activity,
      roles: ["MANAGER", "ADMIN"],
    },
  ];

  const links: NavLink[] = role
    ? allLinks.filter((l) => l.roles.includes(role))
    : [];

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
              "flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200",
              isActive(link.href)
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-medium"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
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
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
