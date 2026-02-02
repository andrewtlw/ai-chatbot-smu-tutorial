import { z } from "zod";

/**
 * Research Pipeline Types
 */

// Status of the research pipeline
export type ResearchStatus =
  | "rewriting-query"
  | "searching"
  | "synthesizing"
  | "complete"
  | "error";

// A source extracted from search results
export type ResearchSource = {
  title: string;
  url: string;
  domain: string;
};

// Schema for research API requests
export const researchRequestSchema = z.object({
  id: z.string().uuid(),
  query: z.string().min(1).max(2000),
  chatId: z.string().uuid(),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;

// Full research response data
export type ResearchResponse = {
  originalQuery: string;
  rewrittenQuery: string;
  searchResults: string;
  sources: ResearchSource[];
  synthesis: string;
};
