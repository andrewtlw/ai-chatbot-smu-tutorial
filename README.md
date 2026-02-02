# AI Chatbot Tutorial

A simple AI chatbot built with Next.js and the Vercel AI SDK. This tutorial project demonstrates how to build a conversational AI application with features like chat history, document creation, and research capabilities.

## Quick Start

### Prerequisites

- **Node.js 20** (recommended) - Higher versions may have compatibility issues with native modules
  - Use `nvm use 20` if you have nvm installed
  - The `.nvmrc` file specifies version 20
- pnpm (`npm install -g pnpm`)

### Setup

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy the environment file and add your API keys:

```bash
cp .env.example .env.local
```

3. Edit `.env.local` with your keys:

```
AUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32
AI_GATEWAY_API_KEY=your-key   # From https://vercel.com/ai-gateway
GROQ_API_KEY=your-key         # Optional: From https://console.groq.com/keys
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Chat Interface** - Conversational AI with streaming responses
- **Local SQLite Database** - No external database setup required
- **Local File Storage** - Files stored in `public/uploads/`
- **Research Mode** - Groq-powered web search pipeline (optional)
- **Document Creation** - AI-generated code, text, and spreadsheets

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **AI**: Vercel AI SDK with xAI Grok models
- **Database**: SQLite (via better-sqlite3 + Drizzle ORM)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Auth.js (NextAuth)

## Project Structure

```
app/              # Next.js app router pages and API routes
components/       # React components
lib/              # Utilities, database, and AI configuration
  ├── ai/         # AI providers and prompts
  ├── db/         # Database schema and queries
data/             # SQLite database (auto-created)
public/uploads/   # Uploaded files (auto-created)
```

## Learn More

See [TUTORIAL.md](./TUTORIAL.md) for a step-by-step guide to understanding and extending this chatbot.
