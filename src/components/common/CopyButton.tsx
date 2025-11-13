import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

/**
 * Reusable copy to clipboard button component with visual feedback
 */
const CopyButton: React.FC<CopyButtonProps> = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
      setCopied(true);
      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 hover:bg-gray-100 rounded-md transition-all ${
        copied
          ? 'bg-green-100 text-green-600'
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
};

export default CopyButton;
