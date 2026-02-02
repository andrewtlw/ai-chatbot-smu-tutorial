import { gateway } from "@ai-sdk/gateway";
import { createGroq } from "@ai-sdk/groq";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import { researchConfig } from "./research/config";

// Check if AI Gateway is available
const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY);

// Initialize Groq provider
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const THINKING_SUFFIX_REGEX = /-thinking$/;

// Default Groq model when gateway is unavailable
const DEFAULT_GROQ_FALLBACK = "llama-3.3-70b-versatile";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

// Models that should be routed through Groq API (pass full model ID as-is)
const GROQ_MODELS = new Set([
  "groq/compound",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "moonshotai/kimi-k2-instruct",
]);

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  // Route Groq models through Groq API (keep full model ID)
  if (GROQ_MODELS.has(modelId)) {
    return groq(modelId);
  }

  // If no gateway key, route everything through Groq
  if (!hasGatewayKey) {
    console.log(
      `No AI_GATEWAY_API_KEY found, routing ${modelId} through Groq fallback`
    );
    return groq(DEFAULT_GROQ_FALLBACK);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const gatewayModelId = modelId.replace(THINKING_SUFFIX_REGEX, "");

    return wrapLanguageModel({
      model: gateway.languageModel(gatewayModelId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return gateway.languageModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return groq("llama-3.1-8b-instant");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  // Use gpt-oss-20b which supports structured JSON output
  return groq("openai/gpt-oss-20b");
}

// Research pipeline models
export function getQueryRewriterModel() {
  return groq(researchConfig.models.queryRewriter);
}

export function getWebSearchModel() {
  return groq(researchConfig.models.webSearch);
}

export function getSynthesisModel() {
  return groq(researchConfig.models.synthesis);
}
