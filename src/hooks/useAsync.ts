import { useCallback, useEffect, useRef, useState } from "react";
import { AppError, getAppError } from "../lib/errors";

export type AsyncStatus = "idle" | "loading" | "error" | "success";

export interface UseAsyncOptions {
  /** Run the function once on mount. Default: true. */
  immediate?: boolean;
  /** Message to use when the error can't be parsed into anything better. */
  fallbackMessage?: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: AppError) => void;
}

export interface UseAsyncResult<T> {
  data: T | null;
  error: AppError | null;
  status: AsyncStatus;
  isIdle: boolean;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  /** Execute the async function; resolves to the result (or null on error). */
  run: () => Promise<T | null>;
  /** Alias of run — the page-owned "Try Again" handler for the error screen. */
  retry: () => Promise<T | null>;
  /** Manually set/replace data (e.g. after an optimistic mutation). */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  /** Clear data/error back to idle. */
  reset: () => void;
}

/**
 * Standardizes the loading / error / success state machine for an async call and
 * exposes a stable `retry` — the callback the unified ErrorScreen invokes to
 * re-run the page's own loader ("page-owned retry"). Replaces the ad-hoc
 * `useState` loading/error triplets and bespoke retry flags scattered across
 * containers.
 *
 * `run`/`retry` are stable across renders, so they're safe to use in effect
 * dependency arrays. For param-driven reloads, pass `{ immediate: false }` and
 * call `run()` from your own effect when the param changes.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  options: UseAsyncOptions = {},
): UseAsyncResult<T> {
  const { immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [status, setStatus] = useState<AsyncStatus>(
    immediate ? "loading" : "idle",
  );

  // Keep latest fn/options in refs so `run` stays referentially stable.
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mountedRef = useRef(true);
  // Monotonic id so a slow earlier call can't overwrite a newer one.
  const callIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (): Promise<T | null> => {
    const callId = ++callIdRef.current;
    setStatus("loading");
    setError(null);
    try {
      const result = await fnRef.current();
      if (!mountedRef.current || callId !== callIdRef.current) return result;
      setData(result);
      setStatus("success");
      optionsRef.current.onSuccess?.(result);
      return result;
    } catch (err) {
      if (!mountedRef.current || callId !== callIdRef.current) return null;
      const appError = getAppError(err, optionsRef.current.fallbackMessage);
      setError(appError);
      setStatus("error");
      optionsRef.current.onError?.(appError);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus("idle");
  }, []);

  const startedRef = useRef(false);
  useEffect(() => {
    if (immediate && !startedRef.current) {
      startedRef.current = true;
      void run();
    }
  }, [immediate, run]);

  return {
    data,
    error,
    status,
    isIdle: status === "idle",
    isLoading: status === "loading",
    isError: status === "error",
    isSuccess: status === "success",
    run,
    retry: run,
    setData,
    reset,
  };
}
