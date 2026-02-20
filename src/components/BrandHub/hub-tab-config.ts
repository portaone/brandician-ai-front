export type UiTabKey =
  | "strategy"
  | "positioning"
  | "visual_identity"
  | "voice_content"
  | "gaps";

export const BACKEND_TAB_FOR_UI: Record<UiTabKey, string> = {
  strategy: "essence",
  positioning: "positioning",
  visual_identity: "visual_identity",
  voice_content: "expression",
  gaps: "gaps",
};

export interface UiTabConfig {
  key: UiTabKey;
  label: string;
  description: string;
  properties: {
    key: string;
    title: string;
    helper?: string;
  }[];
}

export const TAB_CONFIGS: UiTabConfig[] = [
  {
    key: "strategy",
    label: "Strategy",
    description:
      "Define the brand's foundation, personality, and intent – why it exists and what it stands for.",
    properties: [
      {
        key: "mission",
        title: "Mission",
        helper: "Why the brand exists and the change it aims to create.",
      },
      {
        key: "vision",
        title: "Vision",
        helper: "The future the brand is working toward.",
      },
      {
        key: "core_values",
        title: "Brand Values",
        helper: "The beliefs that guide decisions, behaviour, and culture.",
      },
      {
        key: "brand_archetypes",
        title: "Brand Archetypes",
        helper: "The psychological foundation for your personality and style.",
      },
      {
        key: "jobs_to_be_done",
        title: "Customer Needs Summary",
        helper:
          "The functional, emotional, and social needs your brand helps your audience solve.",
      },
    ],
  },
  {
    key: "positioning",
    label: "Positioning",
    description:
      "Clarify who you serve, how you're different, and why your brand is the obvious choice.",
    properties: [
      {
        key: "target_audience",
        title: "Target Audience Overview",
        helper: "Who the brand is designed to serve, with the right context.",
      },
      {
        key: "ideal_persona",
        title: "Ideal Persona",
        helper:
          "A composite profile of your most valuable customer based on JTBD segments.",
      },
      {
        key: "competitive_snapshot",
        title: "Competitive Snapshot",
        helper:
          "How competitors talk, look, and behave – and where you should differentiate.",
      },
      {
        key: "unique_value_proposition",
        title: "Unique Value Proposition (UVP)",
        helper: "The core promise that clearly sets you apart.",
      },
      {
        key: "messaging_pillars",
        title: "Messaging Pillars",
        helper: "Core narrative anchors that express your UVP across channels.",
      },
    ],
  },
  {
    key: "visual_identity",
    label: "Visual Identity",
    description:
      "Make the brand recognisable, coherent, and emotionally aligned across all visual touchpoints.",
    properties: [
      {
        key: "visual_style_summary",
        title: "Visual Style Summary",
        helper:
          "The overall visual tone, aesthetic approach, and art direction for all brand touchpoints.",
      },
      {
        key: "logo_and_mark_system",
        title: "Logo & Mark System",
        helper:
          "How your logo family works together and how to use it consistently.",
      },
      {
        key: "color_palette",
        title: "Color Palette",
        helper:
          "Core colours, roles, and usage guidelines derived from your archetype and positioning.",
      },
      {
        key: "typography",
        title: "Typography",
        helper:
          "Primary and secondary typefaces, hierarchy, and usage recommendations.",
      },
      {
        key: "imagery_guidelines",
        title: "Imagery Guidelines",
        helper:
          "Photography and illustration styles that match your brand's tone.",
      },
      {
        key: "iconography",
        title: "Iconography",
        helper:
          "Recommended icon style and behaviour so your UI feels coherent.",
      },
    ],
  },
  {
    key: "voice_content",
    label: "Voice & Content",
    description:
      "Ensure everything you write sounds like you and connects with your audience.",
    properties: [
      {
        key: "tone_of_voice",
        title: "Voice Overview & Tone of Voice",
        helper:
          "A concise definition of how your brand should sound in different contexts.",
      },
      {
        key: "language_guidelines",
        title: "Language Do's and Don'ts",
        helper:
          "Concrete tips on word choice, formality, and style to keep writing on-brand.",
      },
      {
        key: "messaging_themes",
        title: "Messaging Themes & Framing",
        helper:
          "Recurring storylines and angles to use in headlines, intros, and calls-to-action.",
      },
    ],
  },
  {
    key: "gaps",
    label: "Gaps",
    description:
      "Identify market opportunities and competitive gaps where your brand can stand out.",
    properties: [
      {
        key: "gaps",
        title: "Market & Competitive Gaps",
        helper:
          "Underserved needs, unmet expectations, and whitespace opportunities your brand can own.",
      },
    ],
  },
];
