import React from "react";
import { Check, ClipboardCopy } from "lucide-react";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import PaletteSample from "../common/PaletteSample";
import FontColorPresenter from "./FontColorPresenter";

interface PropertyConfidence {
  level: string;
  reasoning?: string;
}

// ── Color palette renderer (preserves existing logic) ──
const COLOR_ROLE_LABELS: Record<string, string> = {
  "main-color": "Main color",
  "supporting-color": "Supporting color",
  "accent-color": "Accent color",
  "body-text-color": "Body text color",
  "light-color": "Light / Background",
};

const ColorPaletteDisplay: React.FC<{ json: string }> = ({ json }) => {
  let data: Record<string, string>;
  try {
    data = JSON.parse(json);
  } catch {
    return <span className="bh-empty">Invalid palette data</span>;
  }

  const entries = Object.entries(COLOR_ROLE_LABELS)
    .map(([key, label]) => ({ key, label, hex: data[key] }))
    .filter((e) => e.hex);

  if (entries.length === 0) {
    return <span className="bh-empty">No colours found</span>;
  }

  return (
    <div>
      {data.rationale && (
        <div className="bh-card-body" style={{ marginBottom: 16 }}>
          <MarkdownPreviewer markdown={data.rationale} />
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 32px" }}>
        {entries.map((e) => (
          <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: e.hex,
                border: "1px solid rgba(0,0,0,0.1)",
                flexShrink: 0,
              }}
            />
            <span className="bh-card-body">
              {e.label}:{" "}
              <span style={{ fontFamily: "monospace", fontSize: "0.85em", opacity: 0.6 }}>
                {e.hex}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Typography renderer (preserves existing logic) ──
function tryParseTypography(json: string): Record<string, any> | null {
  try {
    const data = JSON.parse(json);
    const roles = ["heading", "body", "accent"].filter((r) => data[r]);
    return roles.length > 0 ? data : null;
  } catch {
    return null;
  }
}

const TypographyDisplay: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  const roles = ["heading", "body", "accent"].filter((r) => data[r]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.label && (
        <p className="bh-card-body">
          Font pairing: <strong>{data.label}</strong>
        </p>
      )}
      {data.rationale && (
        <div className="bh-card-body">
          <MarkdownPreviewer markdown={data.rationale} />
        </div>
      )}
      {roles.map((role) => {
        const font = data[role];
        return (
          <div key={role} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                width: 64,
                flexShrink: 0,
              }}
              className="bh-card-sublabel"
            >
              {role}
            </span>
            <span className="bh-card-body">
              <strong>{font.name}</strong>
            </span>
            <span className="bh-card-sublabel">{font.style}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Main Card Component ──
interface BrandHubCardProps {
  title: string;
  helper?: string;
  propKey: string;
  content: string | Record<string, string> | null | undefined;
  confidence: PropertyConfidence | null;
  gapCount: number;
  isGuest: boolean;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  brandId: string;
  colorPaletteJson?: string;
  typographyJson?: string;
}

const CONFIDENCE_LEVEL_CLASS: Record<string, string> = {
  HIGH: "bh-pill-high",
  MEDIUM: "bh-pill-medium",
  LOW: "bh-pill-low",
};

const BrandHubCard: React.FC<BrandHubCardProps> = ({
  title,
  helper,
  propKey,
  content,
  confidence,
  gapCount,
  isGuest,
  copiedKey,
  onCopy,
  brandId,
  colorPaletteJson,
  typographyJson,
}) => {
  const hasContent =
    propKey === "palette"
      ? content && typeof content === "object" && Object.keys(content).length > 0
      : typeof content === "string" && content.trim().length > 0;

  const isCopied = copiedKey === propKey;

  const handleCopyClick = () => {
    if (!hasContent || propKey === "palette") return;
    onCopy(content as string, propKey);
  };

  // Determine which renderer to use
  const renderContent = () => {
    if (!hasContent) {
      return <p className="bh-empty">This section hasn't been populated yet.</p>;
    }

    if (propKey === "palette") {
      return (
        <PaletteSample
          content={JSON.stringify([content])}
          brandId={brandId}
          mode="draft"
        />
      );
    }

    if (propKey === "color_palette") {
      // Show the rich FontColorPresenter if we also have typography data
      if (typographyJson) {
        return (
          <>
            <ColorPaletteDisplay json={content as string} />
            <FontColorPresenter
              colorPaletteJson={content as string}
              typographyJson={typographyJson}
            />
          </>
        );
      }
      return <ColorPaletteDisplay json={content as string} />;
    }

    if (propKey === "typography" && tryParseTypography(content as string)) {
      return <TypographyDisplay data={tryParseTypography(content as string)!} />;
    }

    return (
      <div className="bh-card-body">
        <MarkdownPreviewer markdown={content as string} />
      </div>
    );
  };

  return (
    <div className="bh-card">
      <div className="bh-card-header">
        <div className="bh-card-title-group">
          <span className="bh-card-title">{title}</span>
          {!isGuest && confidence && (
            <span
              className={`bh-pill ${CONFIDENCE_LEVEL_CLASS[confidence.level.toUpperCase()] || ""}`}
              title={confidence.reasoning || undefined}
            >
              {confidence.level} confidence
            </span>
          )}
          {!isGuest && gapCount > 0 && (
            <span className="bh-pill bh-pill-gaps">
              {gapCount} gap{gapCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {hasContent && propKey !== "palette" && (
          <button
            onClick={handleCopyClick}
            className={`bh-btn-copy ${isCopied ? "copied" : ""}`}
            title={`Copy ${title} to clipboard`}
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
        )}
      </div>
      {helper && <p className="bh-card-sublabel">{helper}</p>}
      {renderContent()}
    </div>
  );
};

export default BrandHubCard;
export { tryParseTypography, ColorPaletteDisplay, TypographyDisplay };
