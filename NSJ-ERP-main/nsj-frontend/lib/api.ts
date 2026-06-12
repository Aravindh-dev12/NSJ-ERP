import { API_BASE_URL, API_ENDPOINTS } from "./constants";
import { log } from "@/lib/logger";
import {
  notifyBackendDown,
  notifyBackendUp,
  ErrorCategory,
  getServerContactMessage,
  lookupError,
  statusToCode,
} from "@/lib/errors";

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export class ApiError extends Error {
  public status: number;
  public code: string;
  public data: Record<string, any>;
  public category: ErrorCategory;
  public title: string;
  public description: string;
  public resolution: string | null;
  public requestId: string | undefined;
  public field: string | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    data: Record<string, any> = {}
  ) {
    const def = lookupError(code);

    super(def.description);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
    this.category = def.category;
    this.title = def.title;
    this.description = def.description;
    this.resolution = def.resolution;
    this.requestId =
      typeof data.request_id === "string" ? data.request_id : undefined;
    this.field = typeof data.field === "string" ? data.field : undefined;
  }
}

export interface ApiFetchOptions extends RequestInit {
  skipRefresh?: boolean;
}

export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

let accessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;
let csrfInitPromise: Promise<void> | null = null;

if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (stored) accessToken = stored;
}

export function setAuthToken(token: string | null) {
  accessToken = token ?? null;
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  }
}

export function getAuthToken(): string | null {
  if (!accessToken && typeof window !== "undefined") {
    const stored = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (stored) accessToken = stored;
  }
  return accessToken;
}

export function clearAuthToken() {
  accessToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem("refreshToken");
  }
}

export function forceLogout() {
  clearAuthToken();
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as any).__testExpireToken = () => {
    clearAuthToken();
    console.log(
      "[TEST] Token cleared from memory + storage. Navigate to any page to trigger auto-logout."
    );
  };
  (window as any).__testForceLogout = () => {
    forceLogout();
  };
}


export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401) {
    forceLogout();
  }
  return response;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`, "i")
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function getCsrfToken(): string | undefined {
  return readCookie("csrftoken");
}

async function ensureCsrfToken(method: string) {
  if (CSRF_SAFE_METHODS.has(method)) return;
  if (typeof document === "undefined") return;
  if (getCsrfToken()) return;

  if (!csrfInitPromise) {
    csrfInitPromise = (async () => {
      try {
        await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CSRF}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json, text/plain, */*",
          },
        });
      } catch (error) {
        log.warn("Failed to initialize CSRF token", error);
      } finally {
        csrfInitPromise = null;
      }
    })();
  }

  await csrfInitPromise;
}

async function refreshAccessToken(): Promise<void> {
  // Don't attempt refresh if there's no token stored - user is not logged in
  const currentToken = getAuthToken();
  if (!currentToken) {
    throw new Error("No token to refresh");
  }

  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const storedRefreshToken =
        typeof window !== "undefined"
          ? window.localStorage.getItem("refreshToken")
          : null;

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: storedRefreshToken
            ? JSON.stringify({ refresh_token: storedRefreshToken })
            : undefined,
        }
      );

      if (!response.ok) {
        clearAuthToken();
        throw new Error("Failed to refresh token");
      }

      const data = await response.json().catch(() => null);
      const newToken =
        data?.access_token || data?.accessToken || data?.token || null;
      if (newToken) {
        setAuthToken(newToken);
      } else {
        clearAuthToken();
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildHeaders(
  userHeaders: HeadersInit | undefined,
  isFormDataBody: boolean,
  shouldSetContentType: boolean,
  method: string,
  csrfToken: string | undefined
): HeadersInit {
  const authToken = getAuthToken();
  const base: Record<string, string> = {
    Accept: "application/json",
  };

  // Only set Content-Type when there's a non-FormData body to send.
  // This avoids sending the Content-Type header for methods without a body
  // (e.g. DELETE without body) which can trigger unnecessary CORS preflights.
  if (shouldSetContentType && !isFormDataBody) {
    base["Content-Type"] = "application/json";
  }

  if (authToken) {
    base.Authorization = `Bearer ${authToken}`;
  }

  if (!CSRF_SAFE_METHODS.has(method) && csrfToken) {
    base["X-CSRFToken"] = csrfToken;
  }

  return {
    ...base,
    ...(userHeaders || {}),
  };
}

async function handleResponse<T>(response: Response, url: string): Promise<T> {
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    // Parse the standard error shape from the backend
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.detail === "string" && data.detail) ||
      "An error occurred";

    // Use code from backend if present, otherwise map by HTTP status
    const rawCode = typeof data.code === "string" ? data.code : null;
    const code = rawCode ?? statusToCode(response.status);

    // Suppress logging for endpoints that use 404 as a valid empty-state signal
    const shouldLog = !(
      response.status === 404 &&
      (url.includes("/masters/gold-rates/active/") ||
        url.includes("/gold-rates/active/") ||
        url.includes("/masters/departments/current_active/") ||
        url.includes("/masters/departments/my_departments/"))
    );

    // Mark-done confirmation (400 + requires_confirmation) is expected flow, not an error
    const isMarkDoneConfirmation =
      response.status === 400 &&
      url.includes("/mark-done/") &&
      (data as any)?.requires_confirmation === true;

    if (shouldLog && !isMarkDoneConfirmation) {
      log.error(`API error: ${url} [${response.status}] ${message}`, data);
    }

    throw new ApiError(
      response.status,
      code,
      message,
      data as Record<string, any>
    );
  }

  notifyBackendUp();
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }
  return {} as T;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { skipRefresh = false, headers: userHeaders, body, ...rest } = options;
  const method = (rest.method || "GET").toUpperCase();
  const url = `${API_BASE_URL}${path}`;

  const rawBody =
    body && Object.prototype.toString.call(body) === "[object Object]"
      ? JSON.stringify(body)
      : body;

  const isFormDataBody =
    typeof FormData !== "undefined" && rawBody instanceof FormData;

  await ensureCsrfToken(method);

  const csrfToken = getCsrfToken();

  const shouldSetContentType = rawBody !== undefined && rawBody !== null;
  const headers = buildHeaders(
    userHeaders,
    isFormDataBody,
    shouldSetContentType,
    method,
    csrfToken
  );

  const config: RequestInit = {
    ...rest,
    method,
    credentials: "include",
    headers,
    body: rawBody,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401 && !skipRefresh) {
      // Only attempt refresh if we have a token stored
      const currentToken = getAuthToken();
      if (currentToken) {
        try {
          await refreshAccessToken();
          const refreshedCsrfToken = getCsrfToken();
          const retryHeaders = buildHeaders(
            userHeaders,
            isFormDataBody,
            shouldSetContentType,
            method,
            refreshedCsrfToken
          );
          const retryResponse = await fetch(url, {
            ...config,
            headers: retryHeaders,
          });
          return handleResponse<T>(retryResponse, url);
        } catch {
          // Refresh failed — token truly expired, force logout silently
          forceLogout();
          // Never resolves — page navigates to /login before this matters
          return new Promise<T>(() => {});
        }
      }
      // No token stored — redirect to login silently
      forceLogout();
      return new Promise<T>(() => {});
    }

    return handleResponse<T>(response, url);
  } catch (error) {
    log.error(`Network/API error: ${url}`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Could not reach the server. Check your internet connection."
    );
  }
}

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body: body as BodyInit }),
  put: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body: body as BodyInit }),
  patch: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body: body as BodyInit }),
  delete: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
  // FormData methods for file uploads
  postFormData: <T>(
    path: string,
    formData: FormData,
    options?: ApiFetchOptions
  ) => apiFetch<T>(path, { ...options, method: "POST", body: formData }),
  patchFormData: <T>(
    path: string,
    formData: FormData,
    options?: ApiFetchOptions
  ) => apiFetch<T>(path, { ...options, method: "PATCH", body: formData }),
};
