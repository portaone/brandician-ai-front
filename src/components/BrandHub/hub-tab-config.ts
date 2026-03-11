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
      "The brand's foundation — its purpose, core values, personality, and reason for existing.",
    properties: [
      {
        key: "mission",
        title: "Mission, vision & purpose",
        helper:
          "Why the brand exists, what change it aims to create, and the future it works toward.",
      },
      {
        key: "core_values",
        title: "Brand Values",
        helper:
          "The core beliefs that guide decisions, shape culture, and signal what the brand stands for.",
      },
      {
        key: "brand_archetypes",
        title: "Brand Archetypes",
        helper:
          "The psychological foundation for the brand's personality — primary and secondary archetypes define the emotional tone and behavioural style.",
      },
      {
        key: "tone_of_voice",
        title: "Tone of Voice",
        helper:
          "How the brand sounds across different contexts — shaped by archetypes, but applied to writing and speech.",
      },
      {
        key: "jobs_to_be_done",
        title: "Jobs-to-be-done summary",
        helper:
          "A concise view of the functional, emotional, and social needs the brand helps its audience solve — drawn from multiple user segments.",
      },
    ],
  },
  {
    key: "positioning",
    label: "Positioning",
    description:
      "Who the brand is for, what makes it different, and where it stands in the market.",
    properties: [
      {
        key: "target_audience",
        title: "Target audience overview",
        helper:
          "Who the brand is designed to serve. Contextualises the rest of the strategy.",
      },
      {
        key: "ideal_persona",
        title: "Ideal persona",
        helper:
          "A composite profile built from shared drivers across JTBD segments, with added weight given to the primary persona.",
      },
      {
        key: "competitive_snapshot",
        title: "Competitive snapshot",
        helper:
          "A brief overview of competitors' brand archetypes, messaging patterns, tone, and visual trends — used to avoid sameness and guide differentiation.",
      },
      {
        key: "unique_value_proposition",
        title: "Unique value proposition",
        helper:
          "The core promise that sets the brand apart and delivers clear value to the target audience.",
      },
      {
        key: "messaging_pillars",
        title: "Messaging pillars",
        helper:
          "Core narrative anchors that express the UVP across channels — used for alignment in marketing, sales, and content.",
      },
    ],
  },
  {
    key: "visual_identity",
    label: "Visual Identity",
    description:
      "The visual language that makes the brand recognisable, coherent, and emotionally consistent.",
    properties: [
      {
        key: "logo_and_mark_system",
        title: "Logo & mark system",
        helper:
          "Alternate marks, usage rules, spacing, and application notes appear here once a logo is uploaded.",
      },
      {
        key: "color_palette",
        title: "Font & color palette",
        helper:
          "Brand colours and font pairing — derived from archetype and emotional positioning.",
      },
      {
        key: "typography",
        title: "Typography",
        helper: "Sizing, use cases, and fallback systems for web and print.",
      },
      {
        key: "imagery_guidelines",
        title: "Imagery guidelines & iconography",
        helper:
          "Photography style, illustration themes, lighting, contrast, textures, and iconography — aligned with brand archetypes.",
      },
    ],
  },
  {
    key: "voice_content",
    label: "Voice & Content",
    description:
      "How the brand sounds — its tone, language style, and the content principles that guide all communication.",
    properties: [
      {
        key: "tone_of_voice",
        title: "Voice overview & language guidelines",
        helper:
          "A concise definition of the brand's voice and concrete language guidelines — what to say, what to avoid, and how to stay in character.",
      },
      {
        key: "language_guidelines",
        title: "Starter phrases & framing examples",
        helper:
          "Ready to copy, adapt, or use as inspiration — headlines, email openers, closers, and introductions.",
      },
      {
        key: "messaging_themes",
        title: "Boilerplate & brand description",
        helper:
          "Ready-to-use text for email signatures, press intros, directories, social bios, and partnership decks.",
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
