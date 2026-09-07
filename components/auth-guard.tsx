"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "@/lib/auth-store";

const ROLE_HOME: Record<Role, string> = {
  OWNER: "/owner",
  ACCOUNTANT: "/accountant",
  BUYER: "/buyer",
};

/**
 * Client-side gate, not Next.js middleware. The refresh cookie is scoped
 * to the API's own origin (Railway), never visible to middleware running
 * on the frontend's origin (Vercel) — cross-origin cookies simply don't
 * reach it. hydrate() calling /auth/refresh with credentials:"include" is
 * the actual auth check; this component just reacts to its result.
 */
export function AuthGuard({ requiredRole, children }: { requiredRole: Role; children: React.ReactNode }) {
  const router = useRouter();
  const { status, user, hydrate } = useAuthStore();

  React.useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && user && user.role !== requiredRole) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [status, user, requiredRole, router]);

  if (status !== "authenticated" || !user || user.role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-fg-tertiary">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
