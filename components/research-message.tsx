"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ResearchSource, ResearchStatus } from "@/lib/ai/research/types";
import { cn } from "@/lib/utils";
import { Response } from "./elements/response";
import { ChevronDownIcon, SearchIcon, SparklesIcon } from "./icons";

type ResearchMessageProps = {
  status: ResearchStatus;
  rewrittenQuery?: string;
  searchResults?: string;
  sources?: ResearchSource[];
  synthesis?: string;
};

export function ResearchMessage({
  status,
  rewrittenQuery,
  searchResults,
  sources,
  synthesis,
}: ResearchMessageProps) {
  const [showQuery, setShowQuery] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="w-full space-y-4">
      {/* Status indicator */}
      <ResearchStatusIndicator status={status} />

      {/* Final Answer (prominent) */}
      {synthesis && (
        <div className="rounded-lg border bg-card p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Response>{synthesis}</Response>
          </div>
        </div>
      )}

      {/* Collapsible: Rewritten Query */}
      {rewrittenQuery && (
        <Collapsible onOpenChange={setShowQuery} open={showQuery}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <SparklesIcon size={14} />
            <span className="flex-1 text-left">Expanded Query</span>
            <span
              className={cn(
                "transition-transform",
                showQuery ? "rotate-180" : "rotate-0"
              )}
            >
              <ChevronDownIcon size={14} />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
            {rewrittenQuery}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Collapsible: Web Search Results */}
      {searchResults && (
        <Collapsible onOpenChange={setShowSearch} open={showSearch}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <SearchIcon size={14} />
            <span className="flex-1 text-left">
              Web Search Results
              {sources && sources.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {sources.length} sources
                </span>
              )}
            </span>
            <span
              className={cn(
                "transition-transform",
                showSearch ? "rotate-180" : "rotate-0"
              )}
            >
              <ChevronDownIcon size={14} />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            {/* Sources list */}
            {sources && sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sources.map((source) => (
                  <a
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                    href={source.url}
                    key={source.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="max-w-[150px] truncate">
                      {source.title}
                    </span>
                    <span className="text-muted-foreground">
                      ({source.domain})
                    </span>
                  </a>
                ))}
              </div>
            )}
            {/* Raw search content */}
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <Response>{searchResults}</Response>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function ResearchStatusIndicator({ status }: { status: ResearchStatus }) {
  const statusConfig: Record<
    ResearchStatus,
    { label: string; icon: typeof SparklesIcon } | null
  > = {
    "rewriting-query": { label: "Expanding query...", icon: SparklesIcon },
    searching: { label: "Searching the web...", icon: SearchIcon },
    synthesizing: { label: "Synthesizing answer...", icon: SparklesIcon },
    complete: null,
    error: { label: "Research failed", icon: SparklesIcon },
  };

  const config = statusConfig[status];
  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="animate-pulse">
        <Icon size={14} />
      </span>
      <span>{config.label}</span>
    </div>
  );
}
