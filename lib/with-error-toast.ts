import { toast } from "@/components/ui/toast";

/**
 * Runs `fn`; on rejection, shows a toast with the error's own message
 * (ApiError included, since it subclasses Error) instead of letting it
 * become an unhandled promise rejection with no user-facing feedback.
 * Never re-throws, so a caller's own `finally` (e.g. setLoading(false))
 * still runs exactly once, on both the success and failure path, with no
 * extra try/catch needed at the call site.
 */
export async function withErrorToast<T>(fn: () => Promise<T>, fallback = "Something went wrong."): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    toast({ title: err instanceof Error ? err.message : fallback, variant: "danger" });
    return undefined;
  }
}
