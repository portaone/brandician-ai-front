import { AlertCircle, Mail, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import Button from "../common/Button";
import { useAutoFocus } from "../../hooks/useAutoFocus";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const { login, verifyOTP, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useAutoFocus([otpId]);

  // Clear error when component mounts or when user starts typing
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      clearError();
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    if (error) {
      clearError();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!otpId) {
        const newOtpId = await login(email);
        setOtpId(newOtpId);
      } else {
        await verifyOTP(otpId, otp);
        navigate("/brands");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRetry = () => {
    clearError();
    setOtpId(null);
    setOtp("");
  };

  // Check if error is a connection error
  const isConnectionError =
    error &&
    (error.includes("Unable to connect to the server") ||
      error.includes("Network Error") ||
      error.includes("ERR_CONNECTION_REFUSED"));

  return (
    <div className="bg-gradient-to-b from-neutral-50 to-neutral-100 flex justify-center pt-4 pb-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white px-2 pb-4 sm:p-6 rounded-lg shadow-md">
        <div>
          <h2 className="mt-1.5 text-center text-3xl font-extrabold text-gray-900">
            {otpId ? "Enter verification code" : "Sign in to your account"}
          </h2>
          {otpId && (
            <p className="mt-1.5 text-center text-sm text-gray-600">
              We've sent a verification code to {email}
            </p>
          )}
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleLogin}>
          {!otpId ? (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="appearance-none block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your email"
                />
                <Mail className="absolute right-3 top-2 h-5 w-5 text-gray-400 hidden sm:block" />
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={handleOtpChange}
                className="mt-1 appearance-none block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter verification code"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div
              className={`rounded-md p-3 ${
                isConnectionError
                  ? "bg-orange-50 border border-orange-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle
                    className={`h-5 w-5 ${
                      isConnectionError ? "text-orange-400" : "text-red-400"
                    }`}
                  />
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      isConnectionError ? "text-orange-800" : "text-red-800"
                    }`}
                  >
                    {isConnectionError ? "Connection Issue" : "Error"}
                  </h3>
                  <div
                    className={`mt-1 text-sm ${
                      isConnectionError ? "text-orange-700" : "text-red-700"
                    }`}
                  >
                    {error}
                  </div>
                  {isConnectionError && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        onClick={handleRetry}
                        variant="primary"
                        size="sm"
                        leftIcon={<RefreshCw className="h-3 w-3" />}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            size="md"
            loading={isLoading}
            className="w-full"
          >
            {otpId ? "Verify Code" : "Continue with Email"}
          </Button>

          {otpId && (
            <Button
              type="button"
              onClick={handleRetry}
              variant="secondary"
              size="md"
              className="w-full"
            >
              Oops, I need to change my email address
            </Button>
          )}
        </form>

        <div className="text-center text-sm text-gray-600">
          Don't have a Brandician account yet?{" "}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Click here to sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
