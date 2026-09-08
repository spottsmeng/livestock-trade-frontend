const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  details: unknown;
  status: number;

  constructor(status: number, code: string, message: string, details: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string | null;
};

/**
 * Every call to the API goes through here — one place that attaches the
 * bearer token, sends the httpOnly refresh cookie (credentials: "include"),
 * and unwraps §9's error envelope { error: { code, message, details } }
 * into a typed ApiError instead of every caller re-parsing it.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  // A FormData body (multipart file upload) must be handed to fetch as-is —
  // stringifying it would send "[object FormData]", and setting our own
  // Content-Type would drop the boundary the browser generates for it.
  const body = options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body);

  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const err = payload?.error ?? { code: "UNKNOWN_ERROR", message: "Something went wrong.", details: null };
    throw new ApiError(response.status, err.code, err.message, err.details);
  }

  return payload as T;
}
