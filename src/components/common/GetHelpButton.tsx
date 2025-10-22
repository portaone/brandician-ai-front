import React, { useState, useEffect } from 'react';
import { LifeBuoy, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';
import { auth } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useParams } from 'react-router-dom';

interface GetHelpButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Session storage keys for form persistence
// Name is cached per-user per-session (same key across all pages for the same user)
// Issue details are cached per-page (different key for each page)
const getStorageKey = (key: string, userId?: string, perPage: boolean = true) => {
  if (perPage) {
    return `getHelp_${userId}_${window.location.pathname}_${key}`;
  }
  return `getHelp_${userId}_${key}`;
};

const getPersistedValue = (key: string, userId?: string, perPage: boolean = true): string => {
  try {
    return sessionStorage.getItem(getStorageKey(key, userId, perPage)) || '';
  } catch {
    return '';
  }
};

const setPersistedValue = (key: string, value: string, userId?: string, perPage: boolean = true): void => {
  try {
    sessionStorage.setItem(getStorageKey(key, userId, perPage), value);
  } catch {
    // Ignore storage errors
  }
};

const clearPersistedValues = (userId?: string): void => {
  try {
    // Clear only the page-specific issue details, not the session-wide name
    sessionStorage.removeItem(getStorageKey('issueDetails', userId, true));
  } catch {
    // Ignore storage errors
  }
};

const GetHelpButton: React.FC<GetHelpButtonProps> = ({
  variant = 'secondary',
  size = 'lg',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();
  const params = useParams();
  const brandId = params.brandId;
  const userId = user?.id;

  // Name is cached per-user per-session (across all pages) but initialized from user profile if not cached
  const [name, setName] = useState(() => {
    const cachedName = getPersistedValue('name', userId, false);
    return cachedName || user?.name || '';
  });
  // Issue details are cached per-page per-user using sessionStorage
  const [issueDetails, setIssueDetails] = useState(getPersistedValue('issueDetails', userId, true));
  const [isSending, setIsSending] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const [resultMessage, setResultMessage] = useState('');

  // Update name when user changes - always reset to user's profile name for new user
  useEffect(() => {
    if (user?.name) {
      const cachedName = getPersistedValue('name', userId, false);
      // If no cached name for this user, use profile name
      if (!cachedName) {
        setName(user.name);
      } else {
        // Use cached name for this specific user
        setName(cachedName);
      }
    }
  }, [user?.id, user?.name]);

  // Persist name to sessionStorage (session-wide for this user) whenever it changes
  useEffect(() => {
    if (userId) {
      setPersistedValue('name', name, userId, false);
    }
  }, [name, userId]);

  // Persist issue details to sessionStorage (per-page per-user) whenever it changes
  useEffect(() => {
    if (userId) {
      setPersistedValue('issueDetails', issueDetails, userId, true);
    }
  }, [issueDetails, userId]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleDismiss = () => {
    setIsModalOpen(false);
    // Values are already persisted via useEffect
  };

  const handleSend = async () => {
    if (!name.trim() || !issueDetails.trim()) {
      setResultType('error');
      setResultMessage('Please fill in all fields');
      setShowResultModal(true);
      return;
    }

    setIsSending(true);
    try {
      // Call the API to send help request
      const response = await auth.sendHelpRequest({
        name: name.trim(),
        message: issueDetails.trim(),
        brand_id: brandId,
        url: window.location.href
      });

      // Show success message
      setResultType('success');
      setResultMessage(response.message || 'Your help request has been sent successfully!');
      setShowResultModal(true);

      // Clear form after successful send
      setName(user?.name || '');
      setIssueDetails('');
      clearPersistedValues(userId);

      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Failed to send help request:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to send help request. Please try again.';
      setResultType('error');
      setResultMessage(errorMessage);
      setShowResultModal(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant={variant}
        size={size}
        leftIcon={<LifeBuoy className="h-5 w-5" />}
        title="Get help from Brandician team"
        className={className}
      >
        Get help
      </Button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleDismiss}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-neutral-800">
                Get help from Brandician team
              </h2>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5 space-y-3">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="help-name"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Your Name
                </label>
                <input
                  id="help-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                />
              </div>

              {/* Issue Details Field */}
              <div>
                <label
                  htmlFor="help-issue"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Issue Details
                </label>
                <textarea
                  id="help-issue"
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  placeholder="Describe your issue or question..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-vertical"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="md"
                disabled={isSending}
              >
                Dismiss
              </Button>
              <Button
                onClick={handleSend}
                variant="primary"
                size="md"
                loading={isSending}
                disabled={isSending}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (Success/Error) */}
      {showResultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowResultModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content */}
            <div className="p-8 text-center">
              {resultType === 'success' ? (
                <div className="mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                </div>
              ) : (
                <div className="mb-4">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                </div>
              )}

              <h2 className={`text-2xl font-semibold mb-3 ${
                resultType === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {resultType === 'success' ? 'Success!' : 'Error'}
              </h2>

              <p className="text-neutral-600 mb-6">
                {resultMessage}
              </p>

              <Button
                onClick={() => setShowResultModal(false)}
                variant="primary"
                size="md"
                className="min-w-[140px]"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GetHelpButton;
