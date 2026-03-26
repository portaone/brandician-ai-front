import { AxiosRequestConfig, AxiosResponse } from "axios";

interface ApiLogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number | null;
  error: string | null;
  requestBody: string | null;
  responseBody: string | null;
  durationMs: number;
}

const STORAGE_KEY = "brandician_api_request_logs";
const MAX_ENTRIES = 5;
const MAX_BODY_LENGTH = 1000;

// In-memory store, hydrated from localStorage
let logs: ApiLogEntry[] = [];

try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    logs = JSON.parse(stored);
  }
} catch {
  // Ignore parse errors
}

function syncToStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage errors
  }
}

function truncateBody(data: unknown): string | null {
  if (data === undefined || data === null) return null;
  if (typeof data === "object" && data instanceof FormData) return "[FormData]";

  try {
    const str = JSON.stringify(data);
    if (str.length > MAX_BODY_LENGTH) {
      return str.slice(0, MAX_BODY_LENGTH) + "...[truncated by logger]";
    }
    return str;
  } catch {
    return "[non-serializable]";
  }
}

export function recordRequestEnd(
  config: AxiosRequestConfig,
  response?: AxiosResponse,
  error?: any,
): void {
  const startTime = config.metadata?.startTime;
  const now = Date.now();
  const durationMs = startTime ? now - startTime : 0;

  const entry: ApiLogEntry = {
    timestamp: new Date(now).toISOString(),
    method: (config.method || "UNKNOWN").toUpperCase(),
    url: config.url || "",
    status: response?.status ?? error?.response?.status ?? null,
    error: error
      ? error.response?.statusText || error.message || "Unknown error"
      : null,
    requestBody: truncateBody(config.data),
    responseBody: truncateBody(response?.data ?? error?.response?.data),
    durationMs,
  };

  logs.push(entry);
  if (logs.length > MAX_ENTRIES) {
    logs = logs.slice(-MAX_ENTRIES);
  }
  syncToStorage();
}

export function getFormattedLogs(): string {
  if (logs.length === 0) return "";

  const lines: string[] = [
    `--- Recent API Activity (${logs.length} request${logs.length > 1 ? "s" : ""}) ---`,
    "",
  ];

  logs.forEach((entry, i) => {
    const statusText = entry.status ?? "NO_RESPONSE";
    lines.push(`[${i + 1}] ${entry.timestamp}`);
    lines.push(
      `    ${entry.method} ${entry.url} -> ${statusText} (${entry.durationMs}ms)`,
    );
    if (entry.error) {
      lines.push(`    Error: ${entry.error}`);
    }
    if (entry.requestBody) {
      lines.push(`    Request: ${entry.requestBody}`);
    }
    if (entry.responseBody) {
      lines.push(`    Response: ${entry.responseBody}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}
