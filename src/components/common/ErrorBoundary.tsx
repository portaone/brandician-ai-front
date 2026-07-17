import React, { Component, ReactNode } from "react";
import { AppError } from "../../lib/errors";
import ErrorScreen from "./ErrorScreen";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render errors are caught outside the Router, so ErrorScreen must not
      // rely on router context: no Get Help (needs useParams), Dashboard via a
      // hard navigation. The raw error is logged to the console above.
      const appError: AppError = {
        message:
          "The app ran into an unexpected error. You can try again or head back to your dashboard.",
        isNetworkError: false,
        raw: this.state.error,
      };

      return (
        <ErrorScreen
          error={appError}
          title="Something went wrong"
          onRetry={this.handleRetry}
          showHelp={false}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
