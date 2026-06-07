import React, { useEffect, useMemo } from "react";
import "./brandhub.css";
import {
  normalizeFontSystem,
  fontFamilyStack,
  type FontSystemVM,
} from "../../lib/fontSystem";

interface BrandThemeProviderProps {
  colorPaletteJson?: string;
  typographyJson?: string;
  children: React.ReactNode;
}

interface ParsedColors {
  primary: string;
  supporting: string;
  accent: string;
  text: string;
  light: string;
}

function parseColors(json?: string): ParsedColors | null {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    const primary = data["main-color"];
    const supporting = data["supporting-color"];
    const accent = data["accent-color"];
    const text = data["body-text-color"];
    const light = data["light-color"] || data["background-color"];
    if (!primary) return null;
    return { primary, supporting, accent, text, light };
  } catch {
    return null;
  }
}

/** Parse typography JSON (v3 OR old internal shape) into a unified view model. */
function parseFonts(json?: string): FontSystemVM | null {
  if (!json) return null;
  try {
    return normalizeFontSystem(JSON.parse(json));
  } catch {
    return null;
  }
}

/**
 * Luminance helper to decide text color on colored backgrounds.
 */
export function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function textOnColor(hex: string): string {
  return luminance(hex) > 0.58 ? "#1a1a1a" : "#ffffff";
}

const BrandThemeProvider: React.FC<BrandThemeProviderProps> = ({
  colorPaletteJson,
  typographyJson,
  children,
}) => {
  const colors = useMemo(
    () => parseColors(colorPaletteJson),
    [colorPaletteJson],
  );
  const fonts = useMemo(() => parseFonts(typographyJson), [typographyJson]);

  // Dynamically load Google Fonts (URL is computed from the real per-role weights)
  useEffect(() => {
    if (!fonts || !fonts.googleUrl) return;

    const url = fonts.googleUrl;
    const linkId = "brandhub-google-fonts";

    // Avoid duplicate link tags
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (link) {
      link.href = url;
      return;
    }

    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);

    return () => {
      const el = document.getElementById(linkId);
      if (el) el.remove();
    };
  }, [fonts]);

  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    if (colors) {
      vars["--brand-primary"] = colors.primary;
      vars["--brand-supporting"] = colors.supporting;
      vars["--brand-accent"] = colors.accent;
      vars["--brand-text"] = colors.text;
      vars["--brand-light"] = colors.light;
    }
    if (fonts) {
      vars["--brand-heading-font"] = fontFamilyStack(fonts.primary.name);
      vars["--brand-body-font"] = fontFamilyStack(fonts.secondary.name);
    }
    return vars as React.CSSProperties;
  }, [colors, fonts]);

  return (
    <div className="brandhub-themed" style={cssVars}>
      {children}
    </div>
  );
};

export default BrandThemeProvider;
