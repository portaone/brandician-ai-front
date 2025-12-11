import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Loader2, Share2, AlertCircle } from 'lucide-react';
import { brands } from '../../lib/api';
import Button from './Button';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  brandName?: string;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  brandId,
  brandName = 'brand'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !shareUrl && !isLoading) {
      generateLink();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShareUrl(null);
      setError(null);
      setCopied(false);
      setExpiresAt(null);
    }
  }, [isOpen]);

  const generateLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await brands.getGuestToken(brandId);
      const token = response.access_token;
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/download?token=${token}`;
      setShareUrl(url);

      if (response.access_token_expires) {
        const expDate = new Date(response.access_token_expires);
        setExpiresAt(expDate.toLocaleDateString() + ' ' + expDate.toLocaleTimeString());
      }
    } catch (err: any) {
      console.error('Failed to generate share link:', err);
      setError(err.response?.data?.detail || 'Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Share Brand Assets</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4">
          Share this link to allow others to download the brand assets for <strong>{brandName}</strong>.
          The link provides read-only access to download the assets.
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            <span className="ml-2 text-gray-600">Generating share link...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
            <Button
              onClick={generateLink}
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Share URL */}
        {shareUrl && !isLoading && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Download Link
              </label>
              <div className="flex gap-2">
                <textarea
                  readOnly
                  value={shareUrl}
                  className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            </div>

            {/* Copy Button */}
            <Button
              onClick={handleCopy}
              size="md"
              className="w-full"
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>

            {/* Expiration Info */}
            {expiresAt && (
              <p className="text-xs text-gray-500 text-center">
                This link expires on {expiresAt}
              </p>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Anyone with this link can download the brand assets.
                Share it only with people you trust.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;
