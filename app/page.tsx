"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "@/lib/auth-store";

const ROLE_HOME: Record<Role, string> = { OWNER: "/owner", ACCOUNTANT: "/accountant", BUYER: "/buyer" };

export default function Home() {
  const router = useRouter();
  const { status, user, hydrate } = useAuthStore();

  React.useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  React.useEffect(() => {
    if (status === "authenticated" && user) router.replace(ROLE_HOME[user.role]);
    if (status === "unauthenticated") router.replace("/login");
  }, [status, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <p className="text-sm text-fg-tertiary">Loading…</p>
    </div>
  );
}
