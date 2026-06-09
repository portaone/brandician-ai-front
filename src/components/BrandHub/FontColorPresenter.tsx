import React, { useMemo } from "react";
import { textOnColor } from "./BrandThemeProvider";
import {
  normalizeFontSystem,
  fontFamilyStack,
  pickRenderWeight,
  type FontSystemVM,
} from "../../lib/fontSystem";
import { InlineMarkdown } from "../common/MarkDownPreviewer";

interface FontColorPresenterProps {
  colorPaletteJson: string;
  typographyJson: string;
}

interface ColorEntry {
  key: string;
  name: string;
  hex: string;
}

const COLOR_KEYS: { key: string; name: string }[] = [
  { key: "main-color", name: "Main" },
  { key: "supporting-color", name: "Supporting" },
  { key: "accent-color", name: "Accent" },
  { key: "body-text-color", name: "Text" },
  { key: "light-color", name: "Background" },
];

const FontColorPresenter: React.FC<FontColorPresenterProps> = ({
  colorPaletteJson,
  typographyJson,
}) => {
  const { colors, fonts } = useMemo(() => {
    let parsedColors: ColorEntry[] = [];
    let parsedFonts: FontSystemVM | null = null;

    try {
      const colorData = JSON.parse(colorPaletteJson);
      parsedColors = COLOR_KEYS.map(({ key, name }) => ({
        key,
        name,
        hex:
          colorData[key] ||
          colorData[key.replace("light-color", "background-color")] ||
          "",
      })).filter((c) => c.hex);
    } catch {
      // ignore
    }

    try {
      parsedFonts = normalizeFontSystem(JSON.parse(typographyJson));
    } catch {
      // ignore
    }

    return { colors: parsedColors, fonts: parsedFonts };
  }, [colorPaletteJson, typographyJson]);

  if (colors.length === 0 && !fonts) return null;

  const primaryColor =
    colors.find((c) => c.key === "main-color")?.hex || "#4A7C6F";
  const bgColor = colors.find((c) => c.key === "light-color")?.hex || "#F7F4EF";

  return (
    <div className="bh-presenter-wrap">
      {/* Palette swatches */}
      {colors.length > 0 && (
        <div className="bh-presenter-palette">
          {colors.map((c) => (
            <div
              key={c.key}
              className="bh-palette-swatch"
              style={{ background: c.hex }}
            >
              <span
                className="bh-swatch-name"
                style={{ color: textOnColor(c.hex) }}
              >
                {c.name}
              </span>
              <span
                className="bh-swatch-hex"
                style={{ color: textOnColor(c.hex) }}
              >
                {c.hex}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Fonts + Preview */}
      {fonts && (
        <div className="bh-presenter-body" style={{ background: bgColor }}>
          <div className="bh-presenter-fonts">
            <div className="bh-font-row">
              <p className="bh-font-label">Heading font</p>
              <p
                className="bh-font-display-heading"
                style={{
                  fontFamily: fontFamilyStack(fonts.primary.name),
                  fontWeight: pickRenderWeight(fonts.primary.weights, "display"),
                }}
              >
                {fonts.primary.name}
              </p>
              <p className="bh-font-meta">
                {fonts.primary.weights.length
                  ? `Weights ${fonts.primary.weights.join(", ")}`
                  : "Display"}{" "}
                · Display &amp; titles
              </p>
            </div>
            <div className="bh-font-row">
              <p className="bh-font-label">Body font</p>
              <p
                className="bh-font-display-body"
                style={{
                  fontFamily: fontFamilyStack(fonts.secondary.name),
                  fontWeight: pickRenderWeight(
                    fonts.secondary.weights,
                    "body",
                  ),
                }}
              >
                {fonts.secondary.name} — clear, warm, readable at all sizes.
              </p>
              <p className="bh-font-meta">
                {fonts.secondary.weights.length
                  ? `Weights ${fonts.secondary.weights.join(", ")}`
                  : "Text"}{" "}
                · Body, UI, captions
              </p>
            </div>
            {fonts.accent.name && (
              <div className="bh-font-row">
                <p className="bh-font-label">Accent / UI font</p>
                <p
                  className="bh-font-display-body"
                  style={{
                    fontFamily: fontFamilyStack(fonts.accent.name),
                    fontWeight: pickRenderWeight(fonts.accent.weights, "accent"),
                  }}
                >
                  {fonts.accent.name} — menus, CTAs, labels.
                </p>
                <p className="bh-font-meta">
                  {fonts.accent.weights.length
                    ? `Weights ${fonts.accent.weights.join(", ")}`
                    : "Accent"}{" "}
                  · UI &amp; emphasis
                </p>
              </div>
            )}
          </div>

          <div className="bh-presenter-preview">
            <p className="bh-preview-label">Preview</p>
            <p
              className="bh-preview-heading"
              style={{
                fontFamily: fontFamilyStack(fonts.primary.name),
                fontWeight: pickRenderWeight(fonts.primary.weights, "display"),
              }}
            >
              Your brand, in context
            </p>
            <p
              className="bh-preview-body"
              style={{
                fontFamily: fontFamilyStack(fonts.secondary.name),
                fontWeight: pickRenderWeight(
                  fonts.secondary.weights,
                  "body",
                ),
              }}
            >
              This is how your brand's type pairing looks in a real layout.
              Heading and body fonts working together to create a consistent
              reading experience.
            </p>
            <p
              className="bh-preview-quote"
              style={{
                fontFamily: fontFamilyStack(fonts.accent.name || fonts.primary.name),
                color: primaryColor,
                borderLeftColor: "var(--brand-accent)",
              }}
            >
              A distinctive voice starts with the right typeface.
            </p>
            <button
              className="bh-preview-btn"
              style={{
                background: "var(--brand-accent)",
                fontFamily: fontFamilyStack(fonts.accent.name || fonts.secondary.name),
                fontWeight: pickRenderWeight(fonts.accent.weights, "accent"),
              }}
            >
              Example CTA
            </button>
          </div>

          {(fonts.archetypeFit || fonts.notes) && (
            <div className="bh-font-why">
              {fonts.archetypeFit && (
                <p className="bh-font-why-fit">
                  <strong>Archetype fit:</strong>{" "}
                  <InlineMarkdown text={fonts.archetypeFit} />
                </p>
              )}
              {fonts.notes && (
                <p className="bh-font-why-notes">
                  <InlineMarkdown text={fonts.notes} />
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FontColorPresenter;
