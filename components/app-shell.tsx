"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";

// §11's Trading Console screens, plus the Users screen which is OWNER-only
// (§11.8). Both OWNER and ACCOUNTANT share everything else per §2.1 — Bobby
// and Bing are collaborators, not approver and preparer.
const _CONSOLE_NAV = [
  { href: "/owner", label: () => strings.shell.nav.home, ownerOnly: false },
  { href: "/workbench", label: () => strings.shell.nav.workbench, ownerOnly: false },
  { href: "/benchmark-compare", label: () => strings.shell.nav.benchmarkCompare, ownerOnly: false },
  { href: "/correction-requests", label: () => strings.shell.nav.correctionRequests, ownerOnly: false },
  { href: "/reference-data", label: () => strings.shell.nav.referenceData, ownerOnly: false },
  { href: "/users", label: () => strings.shell.nav.users, ownerOnly: true },
] as const;

function ConsoleNav() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  if (role !== "OWNER" && role !== "ACCOUNTANT") return null;

  return (
    <nav className="flex items-center gap-1">
      {_CONSOLE_NAV.filter((item) => !item.ownerOnly || role === "OWNER").map((item) => {
        const target = item.href === "/owner" ? (role === "OWNER" ? "/owner" : "/accountant") : item.href;
        const active = pathname === target || (item.href === "/workbench" && pathname?.startsWith("/workbench"));
        return (
          <Link
            key={item.href}
            href={target}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-accent-subtle text-accent-default" : "text-fg-secondary hover:bg-sunken hover:text-fg-primary"
            )}
          >
            {item.label()}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex flex-col gap-3 border-b border-subtle bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
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
        </div>
        <ConsoleNav />
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
