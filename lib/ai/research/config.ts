/**
 * Research Pipeline Configuration
 *
 * Edit this file to customize the research pipeline behavior.
 * This is the main configuration file for tutorial experimentation.
 */

export const researchConfig = {
  // Models - swap these to experiment with different Groq models
  models: {
    // Used to expand and improve research queries
    queryRewriter: "openai/gpt-oss-20b",

    // Used for web search (compound models have built-in Tavily search)
    // Options: "groq/compound-mini" (faster) or "groq/compound" (more thorough)
    webSearch: "groq/compound",

    // Used to synthesize search results into a final answer
    synthesis: "openai/gpt-oss-120b",
  },

  // Request limits
  maxQueryLength: 2000,
  maxDuration: 120, // seconds
};
