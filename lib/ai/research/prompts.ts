/**
 * Research Pipeline Prompts
 *
 * Edit these prompts to customize agent behavior.
 * Keep them short and focused for best results.
 */

export const prompts = {
  // Expands user's question into a better research query
  queryRewriter:
    "Expand this research question. Add relevant context and related terms. Output only the expanded query, nothing else.",

  // Prefix for web search requests
  webSearch: "Research this topic thoroughly:",

  // Instructions for synthesizing search results
  synthesis:
    "Synthesize these search results into a clear answer. Use markdown formatting. Cite sources with [title](url) format.",
};
