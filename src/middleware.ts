import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if user is trying to access protected routes
  if (
    pathname.startsWith("/employee") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/shared-goals") ||
    pathname.startsWith("/system-health") ||
    pathname.startsWith("/analytics")
  ) {
    const token = await getToken({ req: request });

    // If no session token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = token.role as string | undefined;

    // Role-based route protection
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/manager") && role !== "MANAGER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/employee") && role !== "EMPLOYEE" && role !== "MANAGER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employee/:path*",
    "/manager/:path*",
    "/admin/:path*",
    "/reports/:path*",
    "/shared-goals/:path*",
    "/system-health/:path*",
    "/analytics/:path*",
  ],
};
