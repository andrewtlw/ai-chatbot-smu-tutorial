"use client";

import type { ReactNode } from "react";
import { ResearchContext, useResearchState } from "@/hooks/use-research";

export function ResearchProvider({ children }: { children: ReactNode }) {
  const researchState = useResearchState();

  return (
    <ResearchContext.Provider value={researchState}>
      {children}
    </ResearchContext.Provider>
  );
}
