"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ResearchSource, ResearchStatus } from "@/lib/ai/research/types";

type ResearchState = {
  status: ResearchStatus | null;
  rewrittenQuery: string | null;
  searchResults: string | null;
  sources: ResearchSource[];
  isActive: boolean;
};

const initialState: ResearchState = {
  status: null,
  rewrittenQuery: null,
  searchResults: null,
  sources: [],
  isActive: false,
};

type ResearchContextValue = {
  research: ResearchState;
  handleResearchData: (delta: { type: string; data: unknown }) => void;
  resetResearch: () => void;
};

const ResearchContext = createContext<ResearchContextValue | null>(null);

export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error("useResearch must be used within a ResearchProvider");
  }
  return context;
}

export function useResearchState() {
  const [research, setResearch] = useState<ResearchState>(initialState);

  const handleResearchData = useCallback(
    (delta: { type: string; data: unknown }) => {
      switch (delta.type) {
        case "data-research-status":
          setResearch((prev) => ({
            ...prev,
            status: delta.data as ResearchStatus,
            isActive: delta.data !== "complete" && delta.data !== "error",
          }));
          break;
        case "data-research-query-rewritten":
          setResearch((prev) => ({
            ...prev,
            rewrittenQuery: delta.data as string,
          }));
          break;
        case "data-research-search-results":
          setResearch((prev) => ({
            ...prev,
            searchResults: delta.data as string,
          }));
          break;
        case "data-research-sources":
          setResearch((prev) => ({
            ...prev,
            sources: delta.data as ResearchSource[],
          }));
          break;
        case "data-research-complete":
          setResearch((prev) => ({
            ...prev,
            isActive: false,
          }));
          break;
        default:
          // Ignore unrecognized data types
          break;
      }
    },
    []
  );

  const resetResearch = useCallback(() => {
    setResearch(initialState);
  }, []);

  return useMemo(
    () => ({
      research,
      handleResearchData,
      resetResearch,
    }),
    [research, handleResearchData, resetResearch]
  );
}

export { ResearchContext };
export type { ResearchContextValue, ResearchState };
