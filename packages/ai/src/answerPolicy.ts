import { AI_NOT_FOUND_MESSAGE } from "./promptTemplates.js";
import type { AIContext, AIProvider, AISource } from "./types.js";

export type VerifiedAnswerPolicyResult = {
  aiProvider: string | null;
  aiUsed: boolean;
  answer: string | null;
  failureReason: string | null;
  model: string | null;
  promptContextCount: number;
  shouldAnswer: boolean;
  sources: AISource[];
};

export async function applyVerifiedAnswerPolicy({
  aiProvider,
  confidence,
  contexts,
  directAnswer,
  faqId,
  question,
  sources
}: {
  aiProvider: AIProvider | null;
  confidence: number;
  contexts: AIContext[];
  directAnswer: string | null | undefined;
  faqId: string | null | undefined;
  question: string;
  sources: AISource[];
}): Promise<VerifiedAnswerPolicyResult> {
  const verifiedContexts = contexts.filter((context) => context.content.trim().length > 0);
  const verifiedSources = sources.filter((source) => source.name.trim().length > 0);
  const hasDirectVerifiedAnswer = Boolean(directAnswer?.trim() && faqId && verifiedSources.length > 0);
  const base = {
    aiProvider: aiProvider?.providerName ?? null,
    model: aiProvider?.modelName ?? null,
    promptContextCount: verifiedContexts.length
  };

  if (!hasDirectVerifiedAnswer) {
    return {
      ...base,
      aiUsed: false,
      answer: null,
      failureReason: "no_verified_context",
      shouldAnswer: false,
      sources: []
    };
  }

  if (confidence >= 90) {
    return {
      ...base,
      aiUsed: false,
      answer: directAnswer!.trim(),
      failureReason: "high_confidence_direct_answer",
      shouldAnswer: true,
      sources: verifiedSources
    };
  }

  if (confidence < 70) {
    return {
      ...base,
      aiUsed: false,
      answer: null,
      failureReason: "confidence_below_answer_threshold",
      shouldAnswer: false,
      sources: []
    };
  }

  if (verifiedContexts.length === 0) {
    return {
      ...base,
      aiUsed: false,
      answer: null,
      failureReason: "no_verified_context",
      shouldAnswer: false,
      sources: []
    };
  }

  if (!aiProvider) {
    return {
      ...base,
      aiUsed: false,
      answer: directAnswer!.trim(),
      failureReason: "ai_provider_not_configured",
      shouldAnswer: true,
      sources: verifiedSources
    };
  }

  try {
    const aiAnswer = await aiProvider.generateAnswer({
      contexts: verifiedContexts,
      question
    });

    if (!aiAnswer.usedContext || aiAnswer.answer === AI_NOT_FOUND_MESSAGE) {
      return {
        ...base,
        aiUsed: true,
        answer: null,
        failureReason: "ai_reported_insufficient_context",
        shouldAnswer: false,
        sources: []
      };
    }

    return {
      ...base,
      aiUsed: true,
      answer: aiAnswer.answer,
      failureReason: null,
      shouldAnswer: true,
      sources: aiAnswer.sources
    };
  } catch {
    return {
      ...base,
      aiUsed: false,
      answer: directAnswer!.trim(),
      failureReason: "ai_provider_failed",
      shouldAnswer: true,
      sources: verifiedSources
    };
  }
}
