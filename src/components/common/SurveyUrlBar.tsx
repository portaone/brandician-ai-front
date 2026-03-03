import { Copy, ExternalLink } from "lucide-react";
import React, { useState } from "react";

interface SurveyUrlBarProps {
  url: string;
  label?: string;
}

/**
 * Read-only URL bar with Open and Copy buttons.
 * Used on the survey creation success screen and collect-feedback page.
 */
const SurveyUrlBar: React.FC<SurveyUrlBarProps> = ({
  url,
  label = "Survey URL",
}) => {
  const [copyFeedback, setCopyFeedback] = useState<string>("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      setCopyFeedback("Failed to copy");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
      </label>
      <div className="flex">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 w-full p-2 border border-r-0 border-neutral-300 rounded-l-md bg-neutral-50 text-sm"
        />
        <button
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          className="px-4 py-2 bg-neutral-100 border border-l-0 border-neutral-300 hover:bg-neutral-200 transition-colors"
          title="Open survey"
        >
          <ExternalLink className="h-5 w-5" />
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-md hover:bg-neutral-200 transition-colors relative"
          title="Copy URL"
        >
          {copyFeedback ? (
            <span className="text-xs font-medium text-green-600">
              {copyFeedback}
            </span>
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SurveyUrlBar;
