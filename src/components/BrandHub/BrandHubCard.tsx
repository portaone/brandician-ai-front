import React from "react";
import { Check, ClipboardCopy } from "lucide-react";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import PaletteSample from "../common/PaletteSample";
import FontColorPresenter from "./FontColorPresenter";

interface PropertyConfidence {
  level: string;
  reasoning?: string;
}

// ── Combined "Color palette & typography" card (Visual Identity) ──
// Keyed on color_usage_guidance: `content` carries the usage text, while the
// presenter + rationales are read from the color_palette / typography JSON.
// The header confidence/gap pills key off this property: confidence matches by
// exact key/title (so it reflects only color_usage_guidance, if the backend
// scores it), while gap counting matches the title fuzzily and therefore
// aggregates "color palette" + "typography" + usage gaps onto this one card.
const COLOR_TYPOGRAPHY_KEY = "color_usage_guidance";

function parseRationale(json?: string): string | null {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    return typeof data.rationale === "string" && data.rationale.trim()
      ? data.rationale
      : null;
  } catch {
    return null;
  }
}

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
    // Combined Visual Identity card: presenter → color rationale →
    // color usage guidance → typography rationale. Rendered independent of the
    // standard empty-state gating so it shows even before usage text exists.
    if (propKey === COLOR_TYPOGRAPHY_KEY) {
      const colorRationale = parseRationale(colorPaletteJson);
      const typographyRationale = parseRationale(typographyJson);
      const usageGuidance =
        typeof content === "string" && content.trim().length > 0
          ? (content as string)
          : null;

      const emptyHint = (
        <p className="bh-empty">This section hasn't been populated yet.</p>
      );

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(colorPaletteJson || typographyJson) && (
            <FontColorPresenter
              colorPaletteJson={colorPaletteJson ?? ""}
              typographyJson={typographyJson ?? ""}
            />
          )}
          {colorRationale && (
            <div>
              <p className="bh-card-sublabel" style={{ marginBottom: 4 }}>
                Color palette
              </p>
              <div className="bh-card-body">
                <MarkdownPreviewer markdown={colorRationale} />
              </div>
            </div>
          )}
          <div>
            <p className="bh-card-sublabel" style={{ marginBottom: 4 }}>
              Color usage guidance
            </p>
            {usageGuidance ? (
              <div className="bh-card-body">
                <MarkdownPreviewer markdown={usageGuidance} />
              </div>
            ) : (
              emptyHint
            )}
          </div>
          {typographyRationale && (
            <div>
              <p className="bh-card-sublabel" style={{ marginBottom: 4 }}>
                Typography
              </p>
              <div className="bh-card-body">
                <MarkdownPreviewer markdown={typographyRationale} />
              </div>
            </div>
          )}
        </div>
      );
    }

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
        {hasContent && propKey !== "palette" && propKey !== COLOR_TYPOGRAPHY_KEY && (
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
