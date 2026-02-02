# AI Chatbot Tutorial

This tutorial walks you through the key components of this AI chatbot application and shows you how to extend it.

## Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [How Chat Messages Work](#how-chat-messages-work)
3. [Adding a New AI Provider](#adding-a-new-ai-provider)
4. [Creating Custom Tools](#creating-custom-tools)
5. [Modifying the System Prompt](#modifying-the-system-prompt)
6. [Using Research Mode](#using-research-mode)

---

## Understanding the Architecture

### Key Files

| File | Purpose |
|------|---------|
| `app/(chat)/api/chat/route.ts` | Main chat API endpoint |
| `lib/ai/providers.ts` | AI model configuration |
| `lib/ai/prompts.ts` | System prompts |
| `lib/db/schema.ts` | Database schema |
| `lib/db/queries.ts` | Database operations |
| `components/chat.tsx` | Main chat UI component |

### Request Flow

1. User sends a message via the chat UI
2. Message hits `/api/chat` endpoint
3. Server streams response using AI SDK
4. Messages are saved to SQLite database
5. UI updates in real-time via streaming

---

## How Chat Messages Work

### The Chat API (`app/(chat)/api/chat/route.ts`)

The chat endpoint handles message processing:

```typescript
// Simplified example
export async function POST(request: Request) {
  const { message, selectedChatModel } = await request.json();

  // Stream AI response
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: getLanguageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages: [...previousMessages, message],
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

### Database Schema (`lib/db/schema.ts`)

Messages are stored with this structure:

```typescript
export const message = sqliteTable("Message", {
  id: text("id").primaryKey(),
  chatId: text("chatId").notNull(),
  role: text("role").notNull(),  // "user" | "assistant"
  parts: text("parts", { mode: "json" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});
```

---

## Adding a New AI Provider

### Step 1: Install the Provider

```bash
pnpm add @ai-sdk/openai  # Example: Adding OpenAI
```

### Step 2: Update Providers (`lib/ai/providers.ts`)

```typescript
import { createOpenAI } from "@ai-sdk/openai";

// Add after existing providers
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add to the chatModels array
export const chatModels: ChatModel[] = [
  // ... existing models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI's latest model",
  },
];

// Update getLanguageModel function
export function getLanguageModel(model: string) {
  if (model.startsWith("gpt-")) {
    return openai(model);
  }
  // ... existing logic
}
```

### Step 3: Add Environment Variable

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
```

---

## Creating Custom Tools

Tools let the AI perform actions like fetching data or creating documents.

### Step 1: Define the Tool (`lib/ai/tools/my-tool.ts`)

```typescript
import { tool } from "ai";
import { z } from "zod";

export const myCustomTool = tool({
  description: "Describe what this tool does",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    // Your logic here
    const result = await fetchSomeData(query);
    return result;
  },
});
```

### Step 2: Register in Chat Route

In `app/(chat)/api/chat/route.ts`:

```typescript
import { myCustomTool } from "@/lib/ai/tools/my-tool";

// In the streamText call
const result = streamText({
  // ...
  tools: {
    getWeather,
    createDocument,
    myCustomTool,  // Add your tool
  },
});
```

---

## Modifying the System Prompt

### Edit `lib/ai/prompts.ts`

```typescript
export const regularPrompt = `You are a friendly assistant! Keep your responses concise and helpful.

// Add your custom instructions here
When the user asks about [topic], always [do something specific].
`;
```

### Model-Specific Prompts

```typescript
export const systemPrompt = ({ selectedChatModel }) => {
  // Different prompts for different models
  if (selectedChatModel.includes("reasoning")) {
    return `${regularPrompt}\n\nThink step by step.`;
  }

  return `${regularPrompt}\n\n${artifactsPrompt}`;
};
```

---

## Using Research Mode

Research mode uses Groq for fast web search-augmented responses.

### How It Works

1. User enables "Research" toggle in the chat UI
2. Message is routed to `/api/research` instead of `/api/chat`
3. Groq performs web search and synthesizes results
4. Response streams back with citations

### Configuration (`lib/ai/research/config.ts`)

```typescript
export const researchConfig = {
  model: "groq/compound-mini",  // Groq's search-enabled model
  maxTokens: 4096,
};
```

### Enabling Research Mode

Ensure you have a Groq API key in your `.env.local`:

```bash
GROQ_API_KEY=gsk_your-key-here
```

---

## Common Customizations

### Change the Default Model

In `lib/ai/models.ts`:

```typescript
export const DEFAULT_CHAT_MODEL = "grok-2-1212";  // Change this
```

### Modify Rate Limits

In `lib/ai/entitlements.ts`:

```typescript
export const entitlementsByUserType = {
  guest: { maxMessagesPerDay: 10 },
  regular: { maxMessagesPerDay: 100 },
};
```

### Add New Message Types

In `lib/types.ts`, extend the message parts:

```typescript
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "image"; url: string }
  | { type: "custom"; data: unknown };  // Add new types
```

---

## Next Steps

- Explore the `components/` folder to understand the UI
- Check `tests/` for example usage patterns
- Read the [AI SDK docs](https://ai-sdk.dev) for advanced features
- Try deploying to Vercel for production use
