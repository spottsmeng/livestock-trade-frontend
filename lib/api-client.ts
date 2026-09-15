export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

type RefreshHandler = () => Promise<string | null>;
let refreshHandler: RefreshHandler | null = null;

/**
 * auth-store registers itself here at module load. api-client can't import
 * auth-store directly — auth-store already imports apiFetch, and a cycle
 * back would make module init order undefined. This is the standard
 * dependency-inversion escape hatch: api-client stays store-agnostic and
 * just calls whatever "give me a fresh token" function was handed to it.
 */
export function setAuthRefreshHandler(handler: RefreshHandler): void {
  refreshHandler = handler;
}

function buildRequest(options: FetchOptions, accessToken: string | null | undefined) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // A FormData body (multipart file upload) must be handed to fetch as-is —
  // stringifying it would send "[object FormData]", and setting our own
  // Content-Type would drop the boundary the browser generates for it.
  const body = options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body);

  return { headers, body };
}

/**
 * Sends the request; if it comes back 401 on a call that carried an access
 * token, silently refreshes once (coalesced in auth-store, so a burst of
 * parallel requests expiring together triggers exactly one /auth/refresh —
 * calling it twice would replay a rotated refresh token and revoke the
 * whole session) and retries once with the new token. Returns the raw
 * Response so both apiFetch (JSON) and apiFetchBlob (file download) can
 * share this instead of duplicating the retry logic.
 */
async function requestWithRefresh(path: string, options: FetchOptions): Promise<Response> {
  const send = (accessToken: string | null | undefined) => {
    const { headers, body } = buildRequest(options, accessToken);
    return fetch(`${API_BASE_URL}/api/v1${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body,
    });
  };

  const response = await send(options.accessToken);
  if (response.status !== 401 || !options.accessToken || !refreshHandler) return response;

  const newToken = await refreshHandler();
  if (newToken) return send(newToken);

  // Refresh itself failed — the session is over, not just this one request
  // (a bad access token alone is recoverable and already was, above). The
  // server's message for the original 401 ("Invalid or expired token.") is
  // accurate but unhelpful; give the user something actionable instead and
  // let AuthGuard's status-driven redirect (already tripped by the failed
  // refresh) take them to /login.
  throw new ApiError(401, "SESSION_EXPIRED", "Your session has expired — please log in again.", null);
}

function toApiError(status: number, payload: unknown, fallbackMessage: string): ApiError {
  const err = (payload as { error?: { code: string; message: string; details: unknown } } | null)?.error ?? {
    code: "UNKNOWN_ERROR",
    message: fallbackMessage,
    details: null,
  };
  return new ApiError(status, err.code, err.message, err.details);
}

/**
 * Every JSON call to the API goes through here — one place that attaches
 * the bearer token, sends the httpOnly refresh cookie (credentials:
 * "include"), transparently renews an expired access token, and unwraps
 * §9's error envelope { error: { code, message, details } } into a typed
 * ApiError instead of every caller re-parsing it.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const response = await requestWithRefresh(path, options);

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) throw toApiError(response.status, payload, "Something went wrong.");

  return payload as T;
}

/** Same auth/refresh/credentials handling as apiFetch, for endpoints that return a file instead of JSON. */
export async function apiFetchBlob(path: string, options: FetchOptions = {}): Promise<Blob> {
  const response = await requestWithRefresh(path, options);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw toApiError(response.status, payload, "Download failed.");
  }

  return response.blob();
}
