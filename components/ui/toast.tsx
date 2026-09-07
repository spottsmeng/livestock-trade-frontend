"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { create } from "zustand";
import { cn } from "@/lib/cn";

type ToastVariant = "default" | "danger";
type ToastItem = { id: string; title: string; description?: string; variant: ToastVariant };

type ToastStore = {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(t: { title: string; description?: string; variant?: ToastVariant }) {
  useToastStore.getState().push({ variant: "default", ...t });
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map(({ id, title, description, variant }) => (
        <ToastPrimitive.Root
          key={id}
          duration={5000}
          onOpenChange={(open) => !open && dismiss(id)}
          className={cn(
            "rounded-md border p-4 shadow-2 data-[state=open]:animate-in data-[state=closed]:animate-out",
            variant === "danger"
              ? "border-status-breach-border bg-status-breach-bg text-status-breach-fg"
              : "border-subtle bg-surface text-fg-primary"
          )}
        >
          <ToastPrimitive.Title className="text-sm font-semibold">{title}</ToastPrimitive.Title>
          {description ? (
            <ToastPrimitive.Description className="mt-1 text-sm">{description}</ToastPrimitive.Description>
          ) : null}
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-50 m-4 flex w-96 max-w-full flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}
