"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RootPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
    } else {
      const role = (session.user as any)?.role;
      if (role === "EMPLOYEE") {
        router.push("/employee");
      } else if (role === "MANAGER") {
        router.push("/manager");
      } else if (role === "ADMIN") {
        router.push("/admin");
      }
    }
  }, [session, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">AtomQuest</h1>
        <p className="text-gray-600 mt-2">Redirecting...</p>
      </div>
    </div>
  );
}
