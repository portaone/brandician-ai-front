import { AxiosError, isAxiosError } from "axios";

/**
 * Machine-readable error codes shared with the backend
 * (see brandician/core/errors.py::ErrorCode). Plus two frontend-only synthetic
 * codes for errors that never reach the server.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  TIMEOUT: "TIMEOUT",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  LLM_GENERATION_FAILED: "LLM_GENERATION_FAILED",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  DOCUMENT_PROCESSING_FAILED: "DOCUMENT_PROCESSING_FAILED",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  AUDIO_PROCESSING_FAILED: "AUDIO_PROCESSING_FAILED",
  // Frontend-only (no server round-trip)
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * The single normalized error shape used everywhere in the app. Produced by
 * {@link parseError}; replaces the ad-hoc `data.detail || data.message || "…"`
 * derivations scattered across stores and components.
 */
export interface AppError {
  /** Human-readable, safe to show the user. */
  message: string;
  /** Machine-readable code (from the backend) when available. */
  code?: string;
  /** HTTP status code, when the error came from a response. */
  status?: number;
  /** Correlation id echoed by the backend — shown on the error screen / sent to support. */
  requestId?: string;
  /** True when the request never reached the server (offline, refused, timeout). */
  isNetworkError: boolean;
  /** Structured extras, e.g. the validation errors array for a 422. */
  details?: unknown;
  /** The original error, for logging/debugging. */
  raw?: unknown;
}

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_MESSAGE =
  "Unable to connect to the server. Please check your connection and try again.";

/** Type guard: is this value already a normalized {@link AppError}? */
export function isAppError(value: unknown): value is AppError {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as AppError).message === "string" &&
    typeof (value as AppError).isNetworkError === "boolean"
  );
}

/** Strip the legacy `"Server error: "` prefix the old backend prepended to every message. */
function stripServerPrefix(message: string): string {
  const cleaned = message.replace(/^Server error:\s*/i, "").trim();
  return cleaned || message;
}

/** Turn a FastAPI `detail` (string, or the default 422 array of {loc,msg,type}) into a string. */
function formatDetail(detail: unknown): string | undefined {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) =>
        d && typeof (d as { msg?: unknown }).msg === "string"
          ? (d as { msg: string }).msg
          : null,
      )
      .filter((m): m is string => !!m);
    if (msgs.length) return msgs.join("; ");
  }
  return undefined;
}

interface ParsedBody {
  message?: string;
  code?: string;
  requestId?: string;
  details?: unknown;
}

/** Extract message/code/requestId/details from a response body of ANY known shape. */
function parseBody(data: unknown): ParsedBody {
  if (typeof data === "string" && data.trim()) {
    return { message: stripServerPrefix(data) };
  }
  if (!data || typeof data !== "object") return {};

  const obj = data as Record<string, unknown>;

  // New unified contract: { error: { code, message, request_id, details } }
  if (obj.error && typeof obj.error === "object") {
    const e = obj.error as Record<string, unknown>;
    return {
      message: typeof e.message === "string" ? e.message : undefined,
      code: typeof e.code === "string" ? e.code : undefined,
      requestId: typeof e.request_id === "string" ? e.request_id : undefined,
      details: e.details ?? undefined,
    };
  }

  // Legacy HTTPException shape: { message: "Server error: ..." }
  if (typeof obj.message === "string") {
    return { message: stripServerPrefix(obj.message) };
  }

  // Legacy validation shape: { error_message: "Input data validation error: ...", path }
  if (typeof obj.error_message === "string") {
    return {
      message: obj.error_message.replace(
        /^Input data validation error:\s*/i,
        "Invalid input: ",
      ),
    };
  }

  // Raw FastAPI default: { detail: string | array }
  if (obj.detail !== undefined) {
    return { message: formatDetail(obj.detail), details: obj.detail };
  }

  return {};
}

/** Pull the correlation id from the response header (backend echoes it) or the request we sent. */
function extractRequestId(error: AxiosError): string | undefined {
  const respHeaders = error.response?.headers as
    | Record<string, unknown>
    | undefined;
  const fromResp =
    respHeaders?.["x-request-id"] ?? respHeaders?.["X-Request-ID"];
  if (fromResp) return String(fromResp);

  const reqHeaders = error.config?.headers as Record<string, unknown> | undefined;
  const fromReq = reqHeaders?.["X-Request-ID"] ?? reqHeaders?.["x-request-id"];
  if (fromReq) return String(fromReq);

  return undefined;
}

/** Sensible message when the body carried none, keyed off the HTTP status. */
function statusFallback(status: number): string | undefined {
  switch (status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have access to this resource.";
    case 404:
      return "The requested resource was not found.";
    case 408:
      return "The request timed out. Please try again.";
    case 429:
      return "Too many requests. Please slow down and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "The server ran into a problem. Please try again.";
    default:
      return undefined;
  }
}

function parseAxiosError(error: AxiosError, fallbackMessage: string): AppError {
  const requestId = extractRequestId(error);

  // No response => the request never reached the server.
  if (!error.response) {
    return {
      message: NETWORK_MESSAGE,
      code: ErrorCode.NETWORK_ERROR,
      isNetworkError: true,
      requestId,
      raw: error,
    };
  }

  const status = error.response.status;
  const body = parseBody(error.response.data);

  return {
    message: body.message || statusFallback(status) || fallbackMessage,
    code: body.code,
    status,
    requestId: body.requestId || requestId,
    details: body.details,
    isNetworkError: false,
    raw: error,
  };
}

/**
 * Normalize ANY thrown value into an {@link AppError}. Handles the unified
 * backend contract, every legacy backend shape, network errors, plain `Error`s,
 * and strings. Idempotent: passing an existing AppError returns it unchanged.
 *
 * @param error the caught value
 * @param fallbackMessage message to use when nothing better can be derived
 */
export function parseError(
  error: unknown,
  fallbackMessage: string = DEFAULT_MESSAGE,
): AppError {
  if (isAppError(error)) return error;

  if (isAxiosError(error)) {
    return parseAxiosError(error, fallbackMessage);
  }

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      isNetworkError: false,
      raw: error,
    };
  }

  if (typeof error === "string" && error.trim()) {
    return { message: error, isNetworkError: false, raw: error };
  }

  return {
    message: fallbackMessage,
    code: ErrorCode.UNKNOWN,
    isNetworkError: false,
    raw: error,
  };
}

/**
 * Get the normalized error, preferring the `appError` the axios interceptor
 * already attached (avoids re-parsing) and falling back to a fresh parse.
 */
export function getAppError(
  error: unknown,
  fallbackMessage?: string,
): AppError {
  if (
    error &&
    typeof error === "object" &&
    isAppError((error as { appError?: unknown }).appError)
  ) {
    const attached = (error as { appError: AppError }).appError;
    // The interceptor pre-parses with no fallback, so a bodyless error resolves
    // to the generic DEFAULT_MESSAGE. Re-apply the caller's contextual fallback
    // in that case, keeping parity with the store path (which passes one).
    if (fallbackMessage && attached.message === DEFAULT_MESSAGE) {
      return { ...attached, message: fallbackMessage };
    }
    return attached;
  }
  return parseError(error, fallbackMessage);
}

// Codes whose message is intentionally generic (the server masks unexpected
// failures behind "Something went wrong…"). For these, a caller-supplied
// context message tells the user far more.
const OPAQUE_CODES = new Set<string>([
  ErrorCode.INTERNAL_ERROR,
  ErrorCode.UNKNOWN,
]);

/**
 * The best message to SHOW the user for a caught error.
 *
 * Returns the backend's own message when it is specific (a 4xx like "Complete
 * the JTBD step first", a network error, a rate-limit, etc.), but swaps in the
 * caller's `contextMessage` when the backend returned an opaque generic error
 * (`INTERNAL_ERROR`) — so users see "We couldn't generate your Brand Hub…"
 * instead of the useless "Something went wrong on our side."
 */
export function messageOr(error: unknown, contextMessage: string): string {
  const e = getAppError(error);
  return e.code && OPAQUE_CODES.has(e.code) ? contextMessage : e.message;
}

/**
 * Like {@link getAppError}, but the returned error's `message` is the best one
 * to SHOW the user (the {@link messageOr} rule: the backend's specific message
 * when meaningful, or `contextMessage` when the backend returned an opaque
 * generic code). `requestId`/`code`/`status` are preserved so a full-screen
 * {@link AppError} consumer (e.g. ErrorScreen) can still show the Reference id.
 *
 * Use this for blocking failures that render an ErrorScreen; use `messageOr`
 * when you only need the string for an inline banner/toast.
 */
export function toDisplayError(error: unknown, contextMessage: string): AppError {
  const e = getAppError(error);
  const message = e.code && OPAQUE_CODES.has(e.code) ? contextMessage : e.message;
  return { ...e, message };
}
