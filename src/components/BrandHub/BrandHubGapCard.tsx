import React from "react";
import { Check, ClipboardCopy } from "lucide-react";

interface Gap {
  property: string;
  name?: string;
  description: string;
  impact?: string;
  quick_fix_question?: string;
  survey_questions?: string[];
  workaround?: string;
  validation_method?: string;
  priority: string;
}

interface BrandHubGapCardProps {
  gap: Gap;
  index: number;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bh-pill-low",
  HIGH: "bh-pill-medium",
  MEDIUM: "bh-pill-medium",
  LOW: "bh-pill-high",
};

const BrandHubGapCard: React.FC<BrandHubGapCardProps> = ({
  gap,
  index,
  copiedKey,
  onCopy,
}) => {
  const copyKey = `gap-${index}`;
  const isCopied = copiedKey === copyKey;

  const handleCopy = () => {
    const parts = [gap.name || gap.property, gap.description];
    if (gap.impact) parts.push(`Impact: ${gap.impact}`);
    if (gap.quick_fix_question) parts.push(`Quick fix: ${gap.quick_fix_question}`);
    if (gap.workaround) parts.push(`Workaround: ${gap.workaround}`);
    onCopy(parts.join("\n"), copyKey);
  };

  return (
    <div className="bh-card bh-gap-card">
      <div className="bh-card-header">
        <div className="bh-card-title-group">
          <span className="bh-card-title">{gap.name || gap.property}</span>
          <span
            className={`bh-pill ${PRIORITY_STYLES[gap.priority.toUpperCase()] || "bh-pill-medium"}`}
          >
            {gap.priority}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`bh-btn-copy ${isCopied ? "copied" : ""}`}
          title="Copy gap to clipboard"
        >
          {isCopied ? (
            <>
              <Check size={13} />
              Copied
            </>
          ) : (
            <>
              <ClipboardCopy size={13} />
              Copy
            </>
          )}
        </button>
      </div>
      {gap.property && gap.name && (
        <p className="bh-card-sublabel">{gap.property}</p>
      )}
      <p className="bh-card-body">{gap.description}</p>
      {gap.impact && (
        <p className="bh-card-body" style={{ marginTop: 4 }}>
          <strong>Impact:</strong> {gap.impact}
        </p>
      )}
      {gap.quick_fix_question && (
        <p className="bh-card-sublabel" style={{ marginTop: 8, fontStyle: "italic" }}>
          Quick fix: {gap.quick_fix_question}
        </p>
      )}
      {gap.workaround && (
        <p className="bh-card-sublabel" style={{ marginTop: 4 }}>
          Workaround: {gap.workaround}
        </p>
      )}
    </div>
  );
};

export default BrandHubGapCard;
export type { Gap };
