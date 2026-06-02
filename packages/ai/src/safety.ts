import { AI_NOT_FOUND_MESSAGE } from "./promptTemplates.js";
import type { AIContext, AIProviderAnswer } from "./types.js";

export function hasVerifiedContexts(contexts: AIContext[]): boolean {
  return contexts.some((context) => context.content.trim().length > 0);
}

export function notFoundAIAnswer(): AIProviderAnswer {
  return {
    answer: AI_NOT_FOUND_MESSAGE,
    sources: [],
    usedContext: false
  };
}
