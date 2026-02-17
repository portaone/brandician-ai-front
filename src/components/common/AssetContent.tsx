import React, { Children } from "react";
import MarkdownPreviewer, { parseMarkdown } from "./MarkDownPreviewer";
import { BrandAsset } from "../../types";
import PaletteSample from "./PaletteSample";

interface AssetContentProps {
  asset: BrandAsset;
  onPaletteSelect?: (index: number) => void;
  isPaletteSaving?: boolean;
}

/**
 * Component to render asset content based on display_as attribute
 */
const AssetContent: React.FC<AssetContentProps> = ({
  asset,
  onPaletteSelect,
  isPaletteSaving,
}) => {
  if (!asset.content)
    return <div className="text-red-500">No content available</div>;

  const displayAs = asset.display_as || "markdown"; // Default to markdown
  const cleanedContent = asset.content
    .split("\n")
    .map((line) => line.trimStart())
    .join("\n");

  // Custom renderer for color codes
  const colorCodeRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g;
  function renderWithColorSwatches(text: string) {
    return text.split(colorCodeRegex).map((part, i) => {
      if (i % 2 === 1) {
        const color = `#${part}`;
        return (
          <span
            key={i}
            style={{
              background: color,
              color: "#fff",
              padding: "0 0.5em",
              borderRadius: "4px",
              marginLeft: "0.2em",
              marginRight: "0.2em",
              fontWeight: "bold",
              display: "inline-block",
            }}
          >
            {color}
          </span>
        );
      }
      return part;
    });
  }

  // Render palette sample if type or display_as is 'palette'
  if (String(displayAs) === "palette" || String(asset.type) === "palette") {
    return (
      <PaletteSample
        content={asset.content}
        onSelect={onPaletteSelect}
        isSaving={isPaletteSaving}
      />
    );
  }

  if (displayAs === "markdown") {
    const html = parseMarkdown(cleanedContent);
    const htmlWithSwatches = html.replace(
      /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g,
      (m) =>
        `<span style="background:${m};color:#fff;padding:0 0.5em;border-radius:4px;margin-left:0.2em;margin-right:0.2em;font-weight:bold;display:inline-block">${m}</span>`,
    );
    return (
      <div className="brand-markdown prose max-w-none markdown-preview">
        <div dangerouslySetInnerHTML={{ __html: htmlWithSwatches }} />
      </div>
    );
  }
  return <div>{cleanedContent}</div>;
};

export default AssetContent;
