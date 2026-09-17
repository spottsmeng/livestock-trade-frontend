import * as React from "react";

/**
 * Delays reflecting `value` until it stops changing for `delayMs` — the
 * standard fix for a type-to-filter input whose value drives a network
 * fetch, so a fast typist fires one request per pause, not one per
 * keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
