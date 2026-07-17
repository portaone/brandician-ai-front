import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { AppError } from "../../lib/errors";
import Button from "./Button";
import GetHelpButton from "./GetHelpButton";

interface ErrorScreenProps {
  /** The normalized error to display (its message is shown to the user). */
  error?: AppError | null;
  /** When provided, renders a "Try Again" button that re-runs the failed request. */
  onRetry?: () => void;
  /** Override the "Go to Dashboard" action. Defaults to a hard nav to /brands. */
  onGoToDashboard?: () => void;
  /** Heading text. Defaults to "Something went wrong". */
  title?: string;
  /** Show the "Get Help" button. Requires a Router context. Default: true. */
  showHelp?: boolean;
  /** Show the "Go to Dashboard" button. Default: true. */
  showDashboard?: boolean;
}

const DEFAULT_TITLE = "Something went wrong";
const DEFAULT_MESSAGE = "An unexpected error occurred. Please try again.";

/**
 * The app's unified full-screen error view. Shows the backend-provided message
 * and offers: Try Again (re-runs the failed request via `onRetry`), Go to
 * Dashboard (→ /brands), and Get Help (opens the existing support modal,
 * pre-filled with the error + request id). Styled with the app's tokens to
 * match NotFound / the auth screens.
 */
const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  onRetry,
  onGoToDashboard,
  title = DEFAULT_TITLE,
  showHelp = true,
  showDashboard = true,
}) => {
  const message = error?.message || DEFAULT_MESSAGE;
  const requestId = error?.requestId;

  const goToDashboard =
    onGoToDashboard ?? (() => (window.location.href = "/brands"));

  const helpPrefill = error
    ? `I ran into an error: ${message}${
        requestId ? `\n\nReference: ${requestId}` : ""
      }`
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <motion.div
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <AlertTriangle className="h-16 w-16 text-primary-500 mx-auto mb-4" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-2">{message}</p>

        {requestId && (
          <p className="text-xs text-gray-400 mb-6 select-all">
            Reference: {requestId}
          </p>
        )}
        {!requestId && <div className="mb-6" />}

        <div className="space-y-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="primary"
              size="lg"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              Try Again
            </Button>
          )}

          {showDashboard && (
            <Button
              onClick={goToDashboard}
              variant="secondary"
              size="lg"
              leftIcon={<LayoutDashboard className="h-4 w-4" />}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          )}

          {showHelp && (
            <GetHelpButton
              variant="tertiary"
              size="lg"
              className="w-full"
              prefillMessage={helpPrefill}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorScreen;
