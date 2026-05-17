import type { NextAuthOptions } from "next-auth";

export const authConfig: Partial<NextAuthOptions> = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Stub — actual callbacks are in auth.ts
  },
};
