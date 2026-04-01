import { AxiosRequestConfig, AxiosResponse } from "axios";

interface ApiLogEntry {
  timestamp: string;
  method: string;
  url: string;
  requestId: string;
  status: number | null;
  error: string | null;
  durationMs: number;
}

const STORAGE_KEY = "brandician_api_request_logs";
const MAX_ENTRIES = 5;

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

export function recordRequestEnd(
  config: AxiosRequestConfig,
  response?: AxiosResponse,
  error?: any,
): void {
  const startTime = config.metadata?.startTime;
  const now = Date.now();

  const entry: ApiLogEntry = {
    timestamp: new Date(now).toISOString(),
    method: (config.method || "UNKNOWN").toUpperCase(),
    url: config.url || "",
    requestId: config.metadata?.requestId || config.headers?.["X-Request-ID"] || "unknown",
    status: response?.status ?? error?.response?.status ?? null,
    error: error
      ? error.response?.statusText || error.message || "Unknown error"
      : null,
    durationMs: startTime ? now - startTime : 0,
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
    lines.push(`    X-Request-ID: ${entry.requestId}`);
    if (entry.error) {
      lines.push(`    Error: ${entry.error}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}
