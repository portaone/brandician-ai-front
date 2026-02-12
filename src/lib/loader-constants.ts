export interface LoaderConfig {
  loadingText?: string;
  steps?: string[];
}

export const LOADER_CONFIGS: Record<string, LoaderConfig> = {
  // Step 2: Brand Summary Generation
  brandSummary: {
    loadingText: "Building your brand summary...",
    steps: [
      "Mission statement",
      "Vision and value proposition",
      "Market positioning",
      "Brand identity and voice",
      "Strategic roadmap",
    ],
  },

  // Step 3: Customer Needs Mapping
  customerNeeds: {
    loadingText: "Mapping customer needs...",
    steps: [
      "Identifying customer personas",
      "Functional drivers",
      "Emotional drivers",
      "Social drivers",
    ],
  },

  // Step 4: Survey Creation
  survey: {
    loadingText: "Creating validation survey...",
    steps: [
      "Positioning validation questions",
      "Messaging clarity checks",
      "Visual identity feedback",
      "Archetype resonance tests",
    ],
  },

  // Step 6: Feedback Review - Summary
  feedbackSummary: {
    loadingText: "Analyzing customer feedback...",
    steps: [
      "Processing customer responses",
      "Identifying positioning adjustments",
      "Refining value proposition",
      "Updating brand messaging",
    ],
  },

  // Step 7: Feedback Review - Customer Needs
  feedbackNeeds: {
    loadingText: "Refining customer needs mapping...",
    steps: [
      "Adjusting customer personas",
      "Refining functional drivers",
      "Updating emotional drivers",
      "Validating social drivers",
    ],
  },

  // Step 8: Feedback Review - Archetype
  feedbackArchetype: {
    loadingText: "Determining brand archetype...",
    steps: [
      "Analyzing customer feedback patterns",
      "Matching validated positioning",
      "Identifying primary archetype",
      "Selecting secondary archetype",
    ],
  },

  // Step 9: Name Selection
  brandName: {
    loadingText: "Evaluating brand name...",
    steps: [
      "Analyzing current name fit",
      "Checking market resonance",
      "Generating alternative suggestions",
      "Evaluating domain availability",
    ],
  },

  // Step 10: Brand Hub Creation
  brandHub: {
    loadingText: "Creating your Brand Hub...",
    steps: [
      "Compiling brand strategy",
      "Building visual identity system",
      "Generating voice & content guidelines",
      "Creating usage examples",
    ],
  },

  primaryPersona: {
    loadingText: "Generating your primary persona...",
  },
  visualIdentity: {
    loadingText: "Creating your visual identity...",
  },
};
