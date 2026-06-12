export enum ErrorCategory {
  CLIENT_ERROR = "CLIENT_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
}

export interface ErrorDefinition {
  code: string;
  httpStatus: number;
  category: ErrorCategory;
  title: string;
  description: string;
  resolution: string | null;
}

export const ERROR_REGISTRY: Record<string, ErrorDefinition> = {
  AUTH_INVALID_CREDENTIALS: {
    code: "AUTH_INVALID_CREDENTIALS",
    httpStatus: 401,
    category: ErrorCategory.CLIENT_ERROR,
    title: "Invalid Login Credentials",
    description: "The email or password you entered is incorrect.",
    resolution: "Check your email and password and try again.",
  },
  AUTH_TOKEN_EXPIRED: {
    code: "AUTH_TOKEN_EXPIRED",
    httpStatus: 401,
    category: ErrorCategory.CLIENT_ERROR,
    title: "Session Expired",
    description: "Your login session has expired.",
    resolution: "Please log in again.",
  },
  AUTH_PERMISSION_DENIED: {
    code: "AUTH_PERMISSION_DENIED",
    httpStatus: 403,
    category: ErrorCategory.CLIENT_ERROR,
    title: "Access Denied",
    description: "You do not have permission to perform this action.",
    resolution: "Contact your administrator.",
  },
  RESOURCE_NOT_FOUND: {
    code: "RESOURCE_NOT_FOUND",
    httpStatus: 404,
    category: ErrorCategory.CLIENT_ERROR,
    title: "Not Found",
    description: "The requested record does not exist.",
    resolution: "Go back and try again.",
  },
  VALIDATION_INVALID_VALUE: {
    code: "VALIDATION_INVALID_VALUE",
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    title: "Invalid Value",
    description: "A value you entered is not valid.",
    resolution: "Check the highlighted field and try again.",
  },
  SERVER_INTERNAL: {
    code: "SERVER_INTERNAL",
    httpStatus: 500,
    category: ErrorCategory.SERVER_ERROR,
    title: "Server Error",
    description: "An unexpected error occurred on the server.",
    resolution: null,
  },
  SERVER_UNAVAILABLE: {
    code: "SERVER_UNAVAILABLE",
    httpStatus: 503,
    category: ErrorCategory.SERVER_ERROR,
    title: "Service Unavailable",
    description: "The server is temporarily unavailable.",
    resolution: null,
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    httpStatus: 0,
    category: ErrorCategory.SERVER_ERROR,
    title: "Unknown Error",
    description: "An unknown error occurred.",
    resolution: null,
  },
};

export function lookupError(code: string): ErrorDefinition {
  return ERROR_REGISTRY[code] ?? ERROR_REGISTRY["UNKNOWN_ERROR"];
}

export function statusToCode(status: number): string {
  if (status === 400) return "VALIDATION_INVALID_VALUE";
  if (status === 401) return "AUTH_INVALID_CREDENTIALS";
  if (status === 403) return "AUTH_PERMISSION_DENIED";
  if (status === 404) return "RESOURCE_NOT_FOUND";
  if (status >= 500) return "SERVER_INTERNAL";
  return "UNKNOWN_ERROR";
}

export function getServerContactMessage(): string {
  return "Please contact your administrator if this issue persists.";
}

// Backend connectivity tracking
let _backendDown = false;

export function notifyBackendDown(): void {
  if (!_backendDown) {
    _backendDown = true;
    console.warn("[api] Backend appears to be unreachable.");
  }
}

export function notifyBackendUp(): void {
  if (_backendDown) {
    _backendDown = false;
    console.info("[api] Backend is reachable again.");
  }
}

export function isBackendDown(): boolean {
  return _backendDown;
}

export type ErrorAudience = "admin" | "customer";

let _audience: ErrorAudience = "customer";

export function setErrorAudience(audience: ErrorAudience): void {
  _audience = audience;
}

export function getErrorAudience(): ErrorAudience {
  return _audience;
}
