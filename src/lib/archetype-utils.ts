import { BrandArchetypeData } from "../types";

export interface ParsedArchetype {
  primaryName: string;
  secondaryName: string;
  primaryContent: string;
  secondaryContent: string;
  combinedExpression: string;
  diffSignal: string;
}

/**
 * Parse a single archetype field.
 * Format: first line is the title, remaining lines are markdown details.
 */
export function parseField(
  text: string | null,
): { name: string; content: string } {
  if (!text || !text.trim()) return { name: "", content: "" };

  const lines = text.trim().split("\n");
  const name = lines[0];
  const content = lines.slice(1).join("\n").trim();
  return { name, content };
}

/**
 * Parse the archetype API response into structured sections.
 * - `primary` / `secondary`: first line = title, rest = markdown details
 * - `combined_expression`: used as Combined Expression (full markdown)
 */
export function parseArchetypeResponse(
  data: BrandArchetypeData,
): ParsedArchetype {
  const primary = parseField(data.primary);
  const secondary = parseField(data.secondary);

  return {
    primaryName: primary.name,
    secondaryName: secondary.name,
    primaryContent: primary.content,
    secondaryContent: secondary.content,
    combinedExpression: data.combined_expression?.trim() || "",
    diffSignal: data.diff_signal?.trim() || "",
  };
}
