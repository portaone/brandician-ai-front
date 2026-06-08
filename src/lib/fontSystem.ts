/**
 * Font-system v3 helpers (BRANDICIAN-172).
 *
 * The backend returns font systems in the v3 wire shape (`FontSystemV3`).
 * Already-persisted `hub.typography`, however, may be in the OLD internal shape
 * (`{ id, label, heading/body/accent: {name,family,style}, googleUrl, rationale }`).
 * `normalizeFontSystem` accepts EITHER and produces one unified view model
 * (`FontSystemVM`) that the selector and Brand Hub both render from.
 *
 * No React imports here — pure + SSR-safe so it can be reused anywhere.
 */

// ── Wire shape (exact backend field names) ───────────────────────────────────
export interface FontSystemV3 {
  id: number; // 1 | 2 | 3
  label?: string;
  primary_font: string;
  primary_weights: string; // comma-separated ints, e.g. "300,600,800"
  secondary_font: string;
  secondary_weights: string;
  accent_font: string;
  accent_weights: string;
  archetype_fit: string; // <= 4 words
  notes: string; // <= 25 words
}

// ── Unified view model the UI renders from ───────────────────────────────────
export interface FontRoleVM {
  name: string;
  weights: number[];
}

export interface FontSystemVM {
  id: string | number;
  label: string; // "System 1" | "System 3 — Archetype" | old free-text label
  isArchetype: boolean;
  primary: FontRoleVM; // headings / titles
  secondary: FontRoleVM; // body / paragraphs
  accent: FontRoleVM; // UI, CTAs, labels
  archetypeFit: string; // "" when absent (old shape)
  notes: string; // "" when absent (old shape)
  googleUrl: string; // computed from real weights — never trusted from the wire
}

// Typographic levels, each mapped to a sensible default weight used only when a
// font ships no weight list. A system specifies a RANGE of weights per role to
// support in-role hierarchy/contrast (e.g. a heavy display + a lighter heading
// in the same primary font), so we resolve a level to an actual loaded weight
// rather than collapsing every level of a role to one weight.
const DEFAULT_LEVEL_WEIGHT = {
  display: 700,
  heading: 600,
  body: 400,
  accent: 600,
} as const;
type FontLevel = keyof typeof DEFAULT_LEVEL_WEIGHT;

/** Parse "300,600,800" → [300, 600, 800] (sorted, deduped, positive ints only). */
export function parseWeights(s?: string | null): number[] {
  if (!s) return [];
  const out = new Set<number>();
  for (const tok of String(s).split(",")) {
    const n = Number(tok.trim());
    if (Number.isInteger(n) && n > 0) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

/** Resolve a typographic level to an actual available weight from the list,
 * honoring the system's intended weight range:
 *  - display → heaviest available
 *  - heading → a step below display (so title vs heading differ) when the font
 *    offers more than one weight, else the only weight
 *  - body    → closest available to 400
 *  - accent  → closest available to 600
 * Falls back to a per-level default when no weights are specified. */
export function pickRenderWeight(weights: number[], level: FontLevel): number {
  if (!weights.length) return DEFAULT_LEVEL_WEIGHT[level];
  const sorted = [...weights].sort((a, b) => a - b);
  const nearestTo = (target: number) =>
    sorted.reduce((best, w) =>
      Math.abs(w - target) < Math.abs(best - target) ? w : best,
    );
  switch (level) {
    case "display":
      return sorted[sorted.length - 1];
    case "heading":
      return sorted.length > 1 ? sorted[sorted.length - 2] : sorted[0];
    case "body":
      return nearestTo(400);
    case "accent":
      return nearestTo(600);
  }
}

/** CSS font-family stack. The Google font name is authoritative; the generic
 * chain is only a fallback while the webfont loads. */
export function fontFamilyStack(name?: string): string {
  if (!name) return "system-ui, -apple-system, 'Segoe UI', sans-serif";
  return `'${name}', system-ui, -apple-system, 'Segoe UI', sans-serif`;
}

/** Build a Google Fonts css2 URL from the VM's per-role fonts + weights.
 * Dedupes by font name (unions weights when e.g. primary === accent) and never
 * requests `ital` (italic is applied via CSS only). */
export function buildGoogleFontsUrl(vm: {
  primary: FontRoleVM;
  secondary: FontRoleVM;
  accent: FontRoleVM;
}): string {
  const byName = new Map<string, Set<number>>();
  for (const role of [vm.primary, vm.secondary, vm.accent]) {
    const name = role.name?.trim();
    if (!name) continue;
    const set = byName.get(name) ?? new Set<number>();
    role.weights.forEach((w) => set.add(w));
    byName.set(name, set);
  }
  if (byName.size === 0) return "";

  const families = [...byName.entries()].map(([name, weights]) => {
    const enc = name.replace(/ /g, "+");
    if (weights.size === 0) return enc;
    const wght = [...weights].sort((a, b) => a - b).join(";");
    return `${enc}:wght@${wght}`;
  });
  return `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;
}

/** Derive the display label + archetype flag from a v3 system id (1/2/3). */
export function labelForSystem(id: number): { label: string; isArchetype: boolean } {
  const isArchetype = Number(id) === 3;
  return { label: isArchetype ? `System ${id} — Archetype` : `System ${id}`, isArchetype };
}

/** Accept a v3 system OR an old-shape font set → unified view model (or null). */
export function normalizeFontSystem(raw: unknown): FontSystemVM | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, any>;

  // New v3 shape — identified by `primary_font`.
  if (typeof r.primary_font === "string" && r.primary_font) {
    const id = Number(r.id);
    const { label, isArchetype } = labelForSystem(Number.isFinite(id) ? id : 0);
    const vm: FontSystemVM = {
      id: r.id,
      // Derive the label from id (single source of truth for the archetype
      // suffix); the backend's generic "System N" label must not override it.
      label,
      isArchetype,
      primary: { name: r.primary_font, weights: parseWeights(r.primary_weights) },
      secondary: { name: r.secondary_font ?? "", weights: parseWeights(r.secondary_weights) },
      accent: { name: r.accent_font ?? "", weights: parseWeights(r.accent_weights) },
      archetypeFit: r.archetype_fit ?? "",
      notes: r.notes ?? "",
      googleUrl: "",
    };
    vm.googleUrl = buildGoogleFontsUrl(vm);
    return vm;
  }

  // Old internal shape — identified by a `heading` object.
  if (r.heading && typeof r.heading === "object" && r.heading.name) {
    const vm: FontSystemVM = {
      id: r.id ?? "",
      label: r.label || "Typography",
      isArchetype: false,
      primary: { name: r.heading.name, weights: [] },
      secondary: { name: r.body?.name ?? "", weights: [] },
      accent: { name: r.accent?.name ?? "", weights: [] },
      archetypeFit: "",
      notes: r.rationale ?? "",
      googleUrl: "",
    };
    vm.googleUrl = buildGoogleFontsUrl(vm);
    return vm;
  }

  return null;
}
