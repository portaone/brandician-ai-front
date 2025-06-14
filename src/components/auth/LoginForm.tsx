import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const { login, verifyOTP, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

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
        navigate('/brands');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRetry = () => {
    clearError();
    setOtpId(null);
    setOtp('');
  };

  // Check if error is a connection error
  const isConnectionError = error && (
    error.includes('Unable to connect to the server') ||
    error.includes('Network Error') ||
    error.includes('ERR_CONNECTION_REFUSED')
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {otpId ? 'Enter verification code' : 'Sign in to your account'}
          </h2>
          {otpId && (
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a verification code to {email}
            </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {!otpId ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your email"
                />
                <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={handleOtpChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter verification code"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className={`rounded-md p-4 ${isConnectionError ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className={`h-5 w-5 ${isConnectionError ? 'text-orange-400' : 'text-red-400'}`} />
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isConnectionError ? 'text-orange-800' : 'text-red-800'}`}>
                    {isConnectionError ? 'Connection Issue' : 'Error'}
                  </h3>
                  <div className={`mt-1 text-sm ${isConnectionError ? 'text-orange-700' : 'text-red-700'}`}>
                    {error}
                  </div>
                  {isConnectionError && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="inline-flex items-center px-3 py-1.5 border border-orange-300 shadow-sm text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-2">⟳</span>
            ) : null}
            {otpId ? 'Verify Code' : 'Continue with Email'}
          </button>

          {otpId && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Oops, I need to change my email address
            </button>
          )}
        </form>

        <div className="text-center text-sm text-gray-600">
          Don't have a Brandician account yet?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
            Click here to sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;