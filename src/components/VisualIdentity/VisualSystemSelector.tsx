import React, { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────

export interface ColorValue {
  hex: string;
  name: string;
}

export interface Palette {
  id: string;
  name: string;
  rationale?: string;
  main: ColorValue;
  supporting: ColorValue;
  accent: ColorValue;
  bodyText: ColorValue;
  light: ColorValue;
}

export interface FontInfo {
  name: string;
  family: string;
  style: string;
}

export interface FontSet {
  id: string;
  label: string;
  rationale?: string;
  heading: FontInfo;
  body: FontInfo;
  accent: FontInfo;
  googleUrl: string;
}

interface VisualSystemSelectorProps {
  palettes: Palette[];
  fontSets: FontSet[];
  brandName: string;
  onSelectionChange?: (paletteIndex: number, fontIndex: number) => void;
}

// ── Backend data transform ───────────────────────────────

export interface BackendPaletteColors {
  name?: string;
  rationale?: string;
  "main-color"?: string;
  "supporting-color"?: string;
  "accent-color"?: string;
  "background-color"?: string;
  "body-text-color"?: string;
  [key: string]: string | undefined;
}

const VARIANT_LABELS = ["A", "B", "C", "D", "E", "F"];

export function transformPalette(
  raw: BackendPaletteColors,
  index: number,
): Palette {
  return {
    id: VARIANT_LABELS[index] || String(index + 1),
    name: raw.name || `Variant ${index + 1}`,
    rationale: raw.rationale || "",
    main: { hex: raw["main-color"] || "#333333", name: "Main" },
    supporting: {
      hex: raw["supporting-color"] || "#eeeeee",
      name: "Supporting",
    },
    accent: { hex: raw["accent-color"] || "#ff4444", name: "Accent" },
    bodyText: { hex: raw["body-text-color"] || "#222222", name: "Body Text" },
    light: {
      hex: raw["light-color"] || raw["background-color"] || "#ffffff",
      name: "Background",
    },
  };
}

// ── Helpers ───────────────────────────────────────────────

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const textOn = (hex: string): string =>
  luminance(hex) > 0.58 ? "#1a1a1a" : "#ffffff";

/** Shorten a label for chip display — take first meaningful word, skip articles */
function chipSub(text: string): string {
  const words = text.split(/[\s(]/);
  const skip = new Set(["the", "a", "an"]);
  const word = words.find((w) => w && !skip.has(w.toLowerCase())) || words[0];
  if (word.length <= 18) return word;
  return word.slice(0, 16) + "…";
}

/** Strip markdown markers for plain-text tooltips. */
function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

const colorRoles: {
  key: keyof Pick<
    Palette,
    "main" | "supporting" | "accent" | "bodyText" | "light"
  >;
  label: string;
}[] = [
  { key: "main", label: "Main color" },
  { key: "supporting", label: "Supporting color" },
  { key: "accent", label: "Accent color" },
  { key: "bodyText", label: "Body text color" },
  { key: "light", label: "Light color" },
];

// ── Shared style objects (from mockup) ───────────────────

const cardBase: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
};

const UI_FONT_STACK = "'Inter', 'Segoe UI', Roboto, Arial, sans-serif";
const UI_CANVAS_BG = "#F3EEF8";
const UI_FONT_CHIP_ACCENT = "#FD615E";

const label9Card: React.CSSProperties = {
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#888",
  lineHeight: 1.5,
  margin: "5px 0",
};

// ── Component ────────────────────────────────────────────

const VisualSystemSelector: React.FC<VisualSystemSelectorProps> = ({
  palettes,
  fontSets,
  brandName,
  onSelectionChange,
}) => {
  const [palIdx, setPalIdx] = useState(0);
  const [fntIdx, setFntIdx] = useState(0);
  const [wide, setWide] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 700 : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 700px)");
    setWide(mq.matches);
    const handler = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const pal = palettes[palIdx];
  const fnt = fontSets[fntIdx];

  // Notify parent whenever the selection changes
  useEffect(() => {
    onSelectionChange?.(palIdx, fntIdx);
  }, [palIdx, fntIdx, onSelectionChange]);

  // ── Chip button (exact copy from visual.tsx) ───────────
  const Chip = ({
    label,
    sub,
    active,
    color,
    onClick,
    title,
  }: {
    label: string;
    sub: string;
    active: boolean;
    color: string;
    onClick: () => void;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        flex: 1,
        padding: "8px 6px 7px",
        borderRadius: "10px",
        border: "none",
        background: active ? color : "#F0F0F0",
        color: active ? textOn(color) : "#666",
        fontFamily: UI_FONT_STACK,
        fontWeight: active ? 700 : 600,
        fontSize: "16px",
        cursor: "pointer",
        transition: "background 0.18s, color 0.18s",
        lineHeight: 1,
      }}
    >
      {label}
      <div
        style={{
          fontSize: "12px",
          fontWeight: 400,
          opacity: 0.75,
          marginTop: "3px",
          lineHeight: 1.1,
        }}
      >
        {sub}
      </div>
    </button>
  );

  // ── Selector card (exact copy from visual.tsx) ─────────
  const SelectorCard = () => (
    <div style={{ ...cardBase, padding: "14px 14px 12px" }}>
      <p
        style={{
          fontFamily: UI_FONT_STACK,
          fontSize: "14px",
          lineHeight: 1.6,
          color: "#555",
        }}
      >
        We've prepared {palettes.length} visual styles designed to match your
        brand personality. Choose your color palette and font pairing, confirm
        your selection at the bottom of the screen, and it will be saved to your
        Brand Hub.
      </p>
      <div style={{ ...label9Card }}>Color palette</div>
      <div style={{ display: "flex", gap: "6px" }}>
        {palettes.map((p, i) => (
          <Chip
            key={p.id}
            label={p.id}
            sub={chipSub(p.name)}
            active={palIdx === i}
            color={p.main.hex}
            onClick={() => setPalIdx(i)}
            title={p.rationale ? stripMarkdown(p.rationale) : undefined}
          />
        ))}
      </div>
      <div style={{ ...label9Card }}>Font pairing</div>
      <div style={{ display: "flex", gap: "6px" }}>
        {fontSets.map((f, i) => (
          <Chip
            key={f.id}
            label={f.id}
            sub={chipSub(f.label)}
            active={fntIdx === i}
            color={pal?.accent?.hex || UI_FONT_CHIP_ACCENT}
            onClick={() => setFntIdx(i)}
            title={f.rationale ? stripMarkdown(f.rationale) : undefined}
          />
        ))}
      </div>
    </div>
  );

  // ── Live preview (exact copy from visual.tsx) ──────────
  const LivePreview = () => (
    <div style={{ ...cardBase, background: pal.light.hex }}>
      {/* Title block — main color */}
      <div style={{ background: pal.main.hex, padding: "22px 20px 18px" }}>
        <div
          style={{
            fontFamily: fnt.heading.family,
            fontSize: "22px",
            fontWeight: 700,
            color: textOn(pal.main.hex),
            lineHeight: 1.2,
            marginBottom: "5px",
          }}
        >
          This is the title
        </div>
        <div
          style={{
            fontFamily: fnt.accent.family,
            fontSize: "12px",
            fontStyle: "italic",
            color: textOn(pal.main.hex),
            opacity: 0.78,
            lineHeight: 1,
          }}
        >
          Subtitle: main color background
        </div>
      </div>

      {/* Supporting stripe */}
      <div
        style={{
          background: pal.supporting.hex,
          padding: "6px 20px",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: textOn(pal.supporting.hex),
            opacity: 0.6,
            lineHeight: 1.5,
            verticalAlign: "middle",
          }}
        >
          Supporting color
        </span>
      </div>

      {/* Body — white background */}
      <div style={{ background: "#ffffff", padding: "18px 20px 20px" }}>
        <div
          style={{
            fontFamily: fnt.heading.family,
            fontSize: "17px",
            fontWeight: 700,
            color: pal.bodyText.hex,
            marginBottom: "9px",
          }}
        >
          This is a heading
        </div>
        <p
          style={{
            fontFamily: fnt.body.family,
            fontSize: "14px",
            lineHeight: 1.65,
            color: pal.bodyText.hex,
            margin: "0 0 14px",
          }}
        >
          <strong>Body / paragraph text</strong> used for presenting the main
          content — articles, service descriptions, blog posts, and more.
        </p>
        <div
          style={{
            fontFamily: fnt.accent.family,
            fontSize: "14px",
            fontStyle: "italic",
            color: pal.main.hex,
            borderLeft: `3px solid ${pal.accent.hex}`,
            paddingLeft: "11px",
            marginBottom: "18px",
            lineHeight: 1.5,
          }}
        >
          This is an accent quote using the display font.
        </div>
        <button
          style={{
            background: pal.accent.hex,
            color: textOn(pal.accent.hex),
            border: "none",
            borderRadius: "50px",
            padding: "10px 24px",
            fontFamily: fnt.body.family,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            cursor: "pointer",
            lineHeight: 1.5,
          }}
        >
          Accent — CTA
        </button>
      </div>
    </div>
  );

  // ── Color swatches ─────────────────────────────────────
  const ColorSwatches = () => (
    <div style={{ ...cardBase }}>
      <div style={{ padding: "11px 16px 8px", lineHeight: 1 }}>
        <span style={label9Card}>Color system — {pal.name}</span>
      </div>
      {colorRoles.map((role) => {
        const c = pal[role.key];
        return (
          <div
            key={role.key}
            style={{
              display: "grid",
              gridTemplateColumns: "32px minmax(0,1fr) auto",
              columnGap: "8px",
              alignItems: "center",
              padding: "9px 16px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: c.hex,
                border: "1px solid rgba(0,0,0,0.07)",
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "10px",
                  lineHeight: 1,
                  color: "#999",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {role.label}
              </div>
              <div
                style={{
                  fontFamily: UI_FONT_STACK,
                  fontWeight: 700,
                  fontSize: "13px",
                  lineHeight: 1.1,
                  color: "#1a1a1a",
                  marginTop: "6px",
                }}
              >
                {c.name}
              </div>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#888",
                background: "#f5f5f5",
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              {c.hex}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Typography card ────────────────────────────────────
  const TypographyCard = () => (
    <div style={{ ...cardBase }}>
      <div style={{ padding: "11px 16px 8px", lineHeight: 1 }}>
        <span style={label9Card}>Typography — {fnt.label}</span>
      </div>
      {[
        {
          role: "Heading font",
          font: fnt.heading,
          sample: "Brand strategy & identity",
          size: "19px",
          weight: "700" as const,
        },
        {
          role: "Body text font",
          font: fnt.body,
          sample: "Clear thinking. Strategic depth. Honest design.",
          size: "13px",
          weight: "400" as const,
        },
        {
          role: "Accent / display font",
          font: fnt.accent,
          sample: "Turn insight into identity.",
          size: "15px",
          weight: "400" as const,
          italic: true as const,
        },
      ].map((item) => (
        <div
          key={item.role}
          style={{
            padding: "12px 16px 13px",
            borderTop: "1px solid #f0f0f0",
            lineHeight: 1.35,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#999",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "6px",
              lineHeight: 1.35,
            }}
          >
            {item.role}
          </div>
          <div
            style={{
              fontFamily: item.font.family,
              fontSize: item.size,
              fontWeight: item.weight,
              fontStyle: "italic" in item && item.italic ? "italic" : "normal",
              color: pal.bodyText.hex,
              lineHeight: 1.35,
              marginBottom: "4px",
            }}
          >
            {item.sample}
          </div>
          <div style={{ fontSize: "10px", color: "#aaa", lineHeight: 1.35 }}>
            {item.font.name} · {item.font.style}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Layout (match docs/visual.tsx mockup) ──
  return (
    <div
      style={{
        background: UI_CANVAS_BG,
        padding: wide ? "24px 36px" : "16px 12px 24px",
        fontFamily: UI_FONT_STACK,
        boxSizing: "border-box",
        marginBottom: "20px",
      }}
    >
      {fnt?.googleUrl ? <link rel="stylesheet" href={fnt.googleUrl} /> : null}
      <div>
        {/* Page title */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontFamily: UI_FONT_STACK,
              fontSize: wide ? "22px" : "18px",
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            Select your visual system
          </div>
        </div>

        {wide ? (
          <>
            {/* Row 1: selectors (left) + live preview (right) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                alignItems: "start",
                marginBottom: "16px",
              }}
            >
              <SelectorCard />
              <LivePreview />
            </div>

            {/* Row 2: color swatches (left) + typography (right) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <ColorSwatches />
              <TypographyCard />
            </div>
          </>
        ) : (
          /* Mobile: single column */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <SelectorCard />
            <LivePreview />
            <ColorSwatches />
            <TypographyCard />
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualSystemSelector;
