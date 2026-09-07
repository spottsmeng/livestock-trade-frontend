"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-subtle bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-fg-primary">{title}</span>
          {user ? <Badge variant="accent">{strings.shell.roleLabels[user.role]}</Badge> : null}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? <span className="text-sm text-fg-secondary">{user.email}</span> : null}
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            {strings.shell.signOut}
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
