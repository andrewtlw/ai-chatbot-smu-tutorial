# Groq AI Chatbot Tutorial

This tutorial walks you through building an AI chatbot powered by Groq's ultra-fast inference. You'll learn how to leverage Groq's unique features including compound models with web search, reasoning effort controls, and blazing-fast open-source models.

## Table of Contents

1. [Getting Started with Groq](#getting-started-with-groq)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Groq Models Overview](#groq-models-overview)
4. [Using Compound Models (Web Search)](#using-compound-models-web-search)
5. [Configuring Reasoning Effort](#configuring-reasoning-effort)
6. [Provider Options & Advanced Features](#provider-options--advanced-features)
7. [Creating Custom Tools](#creating-custom-tools)
8. [Research Mode Deep Dive](#research-mode-deep-dive)

---

## Getting Started with Groq

### Prerequisites

1. Get a free Groq API key at [console.groq.com](https://console.groq.com)
2. Node.js 18+ installed
3. pnpm package manager

### Quick Setup

```bash
# Clone and install
git clone <repo-url>
cd ai-chatbot-smu-tutorial
pnpm install

# Configure environment
cp .env.example .env.local
```

Add your Groq API key to `.env.local`:

```bash
GROQ_API_KEY=gsk_your-key-here
```

### Run the App

```bash
pnpm dev
```

Visit `http://localhost:3000` to start chatting!

---

## Understanding the Architecture

### Key Files

| File | Purpose |
|------|---------|
| `lib/ai/providers.ts` | Groq provider configuration |
| `lib/ai/models.ts` | Available models list |
| `lib/ai/research/config.ts` | Research pipeline settings |
| `app/(chat)/api/chat/route.ts` | Main chat API endpoint |
| `app/(chat)/api/research/route.ts` | Research mode endpoint |

### Request Flow

1. User sends a message via the chat UI
2. Message hits `/api/chat` (or `/api/research` for research mode)
3. Groq processes the request with ultra-low latency
4. Response streams back to the UI in real-time
5. Messages are saved to local SQLite database

---

## Groq Models Overview

Groq offers several model categories, all with industry-leading inference speed:

### Compound Models (Web Search Enabled)

These models have built-in Tavily web search:

| Model ID | Speed | Best For |
|----------|-------|----------|
| `groq/compound-mini` | Fastest | Quick research, simple queries |
| `groq/compound` | Fast | Thorough research, complex topics |

### Open-Source Models via Groq

| Model ID | Size | Best For |
|----------|------|----------|
| `openai/gpt-oss-120b` | 120B | Complex reasoning, long-form content |
| `openai/gpt-oss-20b` | 20B | Balanced speed/quality, structured output |
| `moonshotai/kimi-k2-instruct` | - | Instruction following |
| `llama-3.3-70b-versatile` | 70B | General purpose (default fallback) |

### Configuring Models (`lib/ai/models.ts`)

```typescript
// Change the default model
export const DEFAULT_CHAT_MODEL = "openai/gpt-oss-120b";

// Add a new Groq model
export const chatModels: ChatModel[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "LLaMA 3.3 70B",
    provider: "groq",
    description: "Fast general-purpose model",
  },
  // ... other models
];
```

---

## Using Compound Models (Web Search)

Compound models are Groq's unique offering that combines LLM capabilities with real-time web search.

### How They Work

1. Model analyzes your query
2. Automatically searches the web if needed
3. Synthesizes search results into a coherent response
4. Returns answer with inline citations

### Important: Compound Model Limitations

Compound models do **not** support tool calling. The app automatically disables tools when using compound models:

```typescript
// In app/(chat)/api/chat/route.ts
const isCompoundModel = selectedChatModel.includes("compound");
const supportsTools = !isReasoningModel && !isCompoundModel;

const result = streamText({
  model: getLanguageModel(selectedChatModel),
  // Tools are conditionally enabled
  tools: supportsTools ? { getWeather, createDocument, ... } : undefined,
});
```

### Using Compound Models in Code

```typescript
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use the full model ID
const result = await generateText({
  model: groq("groq/compound-mini"),
  prompt: "What are the latest developments in AI?",
});
```

---

## Configuring Reasoning Effort

For models that support extended thinking, you can control how much reasoning effort the model applies.

### Provider Options for Reasoning

```typescript
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const result = await streamText({
  model: groq("openai/gpt-oss-120b"),
  prompt: "Solve this complex math problem...",

  // Groq-specific provider options
  providerOptions: {
    groq: {
      // Control reasoning effort (low, medium, high)
      reasoningEffort: "high",
    },
  },
});
```

### Reasoning Effort Levels

| Level | Use Case | Token Usage |
|-------|----------|-------------|
| `low` | Simple queries, quick answers | Minimal |
| `medium` | Balanced reasoning | Moderate |
| `high` | Complex problems, detailed analysis | Higher |

### Adding Reasoning Effort to the Chat Route

To add user-configurable reasoning effort, modify `app/(chat)/api/chat/route.ts`:

```typescript
// 1. Update the request schema to accept reasoningEffort
// In app/(chat)/api/chat/schema.ts
export const postRequestBodySchema = z.object({
  // ... existing fields
  reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
});

// 2. Use it in the route
const { reasoningEffort } = requestBody;

const result = streamText({
  model: getLanguageModel(selectedChatModel),
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: modelMessages,

  providerOptions: {
    groq: {
      ...(reasoningEffort && { reasoningEffort }),
    },
  },
});
```

---

## Provider Options & Advanced Features

### All Groq Provider Options

```typescript
const result = await streamText({
  model: groq("llama-3.3-70b-versatile"),
  prompt: "Your prompt here",

  providerOptions: {
    groq: {
      // Reasoning effort for complex tasks
      reasoningEffort: "high",

      // Custom stop sequences
      stop: ["\n\nHuman:", "\n\nAssistant:"],

      // Response format (for structured output)
      responseFormat: { type: "json_object" },
    },
  },

  // Standard AI SDK options
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,
});
```

### Structured Output with Groq

Some Groq models support structured JSON output:

```typescript
import { generateObject } from "ai";
import { z } from "zod";

const result = await generateObject({
  model: groq("openai/gpt-oss-20b"),  // Supports structured output
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
  }),
  prompt: "Analyze this article...",
});

console.log(result.object);  // Typed object
```

### Enabling Extended Thinking (Anthropic-style)

For reasoning models, enable extended thinking:

```typescript
const result = streamText({
  model: getLanguageModel("anthropic/claude-3.7-sonnet-thinking"),
  messages: modelMessages,

  providerOptions: {
    anthropic: {
      thinking: {
        type: "enabled",
        budgetTokens: 10_000,  // Max tokens for thinking
      },
    },
  },
});
```

---

## Creating Custom Tools

Tools let the AI perform actions. Note: Not supported by compound models.

### Define a Tool

```typescript
// lib/ai/tools/search-docs.ts
import { tool } from "ai";
import { z } from "zod";

export const searchDocs = tool({
  description: "Search the documentation for relevant information",
  parameters: z.object({
    query: z.string().describe("The search query"),
    limit: z.number().optional().describe("Max results to return"),
  }),
  execute: async ({ query, limit = 5 }) => {
    // Your search logic here
    const results = await searchDocumentation(query, limit);
    return results;
  },
});
```

### Register the Tool

In `app/(chat)/api/chat/route.ts`:

```typescript
import { searchDocs } from "@/lib/ai/tools/search-docs";

const result = streamText({
  model: getLanguageModel(selectedChatModel),
  tools: supportsTools ? {
    getWeather,
    createDocument,
    searchDocs,  // Add your tool
  } : undefined,
});
```

---

## Research Mode Deep Dive

Research mode uses a multi-stage pipeline for thorough research.

### Pipeline Stages

1. **Query Rewriting**: Expands user query into better search terms
2. **Web Search**: Uses compound model to search the web
3. **Synthesis**: Combines results into a comprehensive answer

### Configuration (`lib/ai/research/config.ts`)

```typescript
export const researchConfig = {
  models: {
    // Query expansion - fast model for rewriting
    queryRewriter: "openai/gpt-oss-20b",

    // Web search - compound model with Tavily
    // "groq/compound-mini" = faster, "groq/compound" = more thorough
    webSearch: "groq/compound",

    // Final synthesis - larger model for quality
    synthesis: "openai/gpt-oss-120b",
  },

  maxQueryLength: 2000,
  maxDuration: 120,
};
```

### Customizing the Research Pipeline

To modify how research works, edit `app/(chat)/api/research/route.ts`:

```typescript
// Change the synthesis prompt
const synthesisPrompt = `
You are a research assistant. Based on the search results below,
provide a comprehensive answer with citations.

Search Results:
${searchResults}

User Question: ${query}

Instructions:
- Cite sources using [1], [2], etc.
- Be thorough but concise
- Highlight key findings
`;
```

---

## Common Customizations

### Switch Default Model

```typescript
// lib/ai/models.ts
export const DEFAULT_CHAT_MODEL = "groq/compound-mini";
```

### Adjust Rate Limits

```typescript
// lib/ai/entitlements.ts
export const entitlementsByUserType = {
  guest: { maxMessagesPerDay: 20 },
  regular: { maxMessagesPerDay: 200 },
};
```

### Add Model-Specific System Prompts

```typescript
// lib/ai/prompts.ts
export const systemPrompt = ({ selectedChatModel }) => {
  if (selectedChatModel.includes("compound")) {
    return `${regularPrompt}

You have web search capabilities. When asked about current events
or facts you're unsure about, search the web for accurate information.`;
  }

  return `${regularPrompt}\n\n${artifactsPrompt}`;
};
```

---

## Troubleshooting

### "Model not found" Error

Ensure you're using the full model ID with prefix:
```typescript
// ✅ Correct
groq("groq/compound-mini")
groq("openai/gpt-oss-120b")

// ❌ Incorrect
groq("compound-mini")
```

### Tool Calls Not Working

Check if you're using a compound model - they don't support tools:
```typescript
const isCompoundModel = modelId.includes("compound");
if (isCompoundModel) {
  console.log("Tools disabled for compound models");
}
```

### Slow Responses

- Use `groq/compound-mini` instead of `groq/compound` for faster search
- Use `openai/gpt-oss-20b` instead of `120b` for faster inference
- Lower `reasoningEffort` for simpler queries

---

## Next Steps

- Explore the [Groq Documentation](https://console.groq.com/docs)
- Check the [AI SDK Documentation](https://ai-sdk.dev)
- Try different model combinations in research config
- Build custom tools for your specific use case
- Deploy to Vercel for production use
