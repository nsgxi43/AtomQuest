"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DemoSwitcher } from "@/components/DemoSwitcher";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
      <DemoSwitcher />
    </DashboardLayout>
  );
}
