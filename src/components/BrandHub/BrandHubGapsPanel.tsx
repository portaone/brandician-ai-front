import React from "react";
import { AlertTriangle } from "lucide-react";
import BrandHubGapCard from "./BrandHubGapCard";
import type { Gap } from "./BrandHubGapCard";

interface BrandHubGapsPanelProps {
  gaps: Gap[];
  loading: boolean;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

const BrandHubGapsPanel: React.FC<BrandHubGapsPanelProps> = ({
  gaps,
  loading,
  copiedKey,
  onCopy,
}) => {
  if (loading) {
    return (
      <div className="bh-loading">
        <svg
          className="animate-spin"
          style={{ width: 16, height: 16, marginRight: 8 }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="31.4 31.4"
            strokeLinecap="round"
          />
        </svg>
        Loading gaps...
      </div>
    );
  }

  return (
    <>
      {/* Internal-only notice banner */}
      <div className="bh-gaps-notice">
        <AlertTriangle size={20} />
        <div className="bh-gaps-notice-text">
          <strong>Internal use only — not part of the shareable Brand Hub</strong>
          Anyone you share this hub with sees only the brand content — no gaps
          tab, no confidence labels.
        </div>
      </div>

      {gaps.length > 0 ? (
        gaps.map((gap, index) => (
          <BrandHubGapCard
            key={index}
            gap={gap}
            index={index}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        ))
      ) : (
        <div className="bh-card" style={{ textAlign: "center" }}>
          <p className="bh-empty">
            No gaps detected. Your brand hub looks complete!
          </p>
        </div>
      )}
    </>
  );
};

export default BrandHubGapsPanel;
