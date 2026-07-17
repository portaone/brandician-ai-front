import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "error" | "success" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastOptions {
  /** Auto-dismiss delay in ms. Default 5000 (errors 7000). Pass 0 to disable. */
  duration?: number;
}

interface ToastApi {
  error: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
}

interface ToastContextValue {
  toast: ToastApi;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Access the app's toast API. Use for NON-blocking errors (validation, background
 * saves, copy/download failures) — for blocking page-load failures use ErrorScreen.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

const ACCENT: Record<ToastType, string> = {
  error: "border-red-500",
  success: "border-green-500",
  info: "border-primary-500",
};

const ICON: Record<ToastType, React.ReactNode> = {
  error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
  success: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
  info: <Info className="h-5 w-5 text-primary-500 shrink-0" />,
};

let idCounter = 0;
const nextId = () => `toast_${Date.now()}_${idCounter++}`;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Clear any pending auto-dismiss timers when the provider unmounts.
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, options?: ToastOptions) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, type, message }]);
      const duration =
        options?.duration ?? (type === "error" ? 7000 : 5000);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const toast = useMemo<ToastApi>(
    () => ({
      error: (message, options) => push("error", message, options),
      success: (message, options) => push("success", message, options),
      info: (message, options) => push("info", message, options),
    }),
    [push],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0 pointer-events-none"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 bg-white p-4 shadow-lg ${ACCENT[t.type]}`}
              role={t.type === "error" ? "alert" : "status"}
            >
              {ICON[t.type]}
              <p className="flex-1 text-sm text-gray-700 break-words">
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
