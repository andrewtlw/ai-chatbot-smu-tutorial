import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText,
} from "ai";
import { auth } from "@/app/(auth)/auth";
import {
  getQueryRewriterModel,
  getSynthesisModel,
  getWebSearchModel,
} from "@/lib/ai/providers";
import { prompts } from "@/lib/ai/research/prompts";
import {
  type ResearchRequest,
  type ResearchSource,
  researchRequestSchema,
} from "@/lib/ai/research/types";
import { saveMessages } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { generateUUID } from "@/lib/utils";

// Research can take longer due to multiple model calls
export const maxDuration = 120;

/**
 * Extract sources from markdown links in content
 * Looks for [title](url) patterns
 */
function extractSourcesFromContent(content: string): ResearchSource[] {
  const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const sources: ResearchSource[] = [];
  const seen = new Set<string>();

  const matches = content.matchAll(urlRegex);
  for (const match of matches) {
    const [, title, url] = match;
    if (!seen.has(url)) {
      seen.add(url);
      try {
        sources.push({
          title,
          url,
          domain: new URL(url).hostname,
        });
      } catch {
        // Skip invalid URLs
      }
    }
  }

  return sources;
}

export async function POST(request: Request) {
  let requestBody: ResearchRequest;

  try {
    const json = await request.json();
    requestBody = researchRequestSchema.parse(json);
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const { query, chatId } = requestBody;

  const stream = createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      try {
        // Step 1: Rewrite the query
        dataStream.write({
          type: "data-research-status",
          data: "rewriting-query",
        });

        const rewriteResult = await generateText({
          model: getQueryRewriterModel(),
          system: prompts.queryRewriter,
          prompt: query,
        });

        const rewrittenQuery = rewriteResult.text;
        dataStream.write({
          type: "data-research-query-rewritten",
          data: rewrittenQuery,
        });

        // Step 2: Web search using Groq compound model
        dataStream.write({
          type: "data-research-status",
          data: "searching",
        });

        const searchResult = await generateText({
          model: getWebSearchModel(),
          messages: [
            {
              role: "user",
              content: `${prompts.webSearch} ${rewrittenQuery}`,
            },
          ],
        });

        const searchContent = searchResult.text;
        const sources = extractSourcesFromContent(searchContent);

        dataStream.write({
          type: "data-research-search-results",
          data: searchContent,
        });

        dataStream.write({
          type: "data-research-sources",
          data: sources,
        });

        // Step 3: Synthesize the results
        dataStream.write({
          type: "data-research-status",
          data: "synthesizing",
        });

        dataStream.write({
          type: "data-research-synthesis-start",
          data: null,
        });

        const synthesisResult = streamText({
          model: getSynthesisModel(),
          system: prompts.synthesis,
          prompt: `Original Question: ${query}

Expanded Research Query: ${rewrittenQuery}

Web Search Findings:
${searchContent}

Available Sources:
${sources.map((s) => `- ${s.title}: ${s.url}`).join("\n")}

Please synthesize a comprehensive answer:`,
        });

        // Stream the synthesis result
        dataStream.merge(
          synthesisResult.toUIMessageStream({ sendReasoning: false })
        );

        // Mark as complete
        dataStream.write({
          type: "data-research-status",
          data: "complete",
        });

        dataStream.write({
          type: "data-research-complete",
          data: null,
        });
      } catch (error) {
        console.error("Research pipeline error:", error);
        dataStream.write({
          type: "data-research-status",
          data: "error",
        });
        throw error;
      }
    },
    generateId: generateUUID,
    onFinish: async ({ messages: finishedMessages }) => {
      // Save assistant messages to database
      if (finishedMessages.length > 0) {
        await saveMessages({
          messages: finishedMessages.map((msg) => ({
            id: msg.id,
            chatId,
            role: msg.role,
            parts: msg.parts,
            attachments: [],
            createdAt: new Date(),
          })),
        });
      }
    },
    onError: () => "Research failed. Please try again.",
  });

  return createUIMessageStreamResponse({ stream });
}
