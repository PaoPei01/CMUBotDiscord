import type { AIContext, AIProvider } from "@campus-qa/ai";
import { AI_NOT_FOUND_MESSAGE } from "@campus-qa/ai";

import type { KnowledgeSearchResult } from "./knowledgeSearch.js";

export type WorkerAIComposition = {
  aiProvider: string | null;
  aiUsed: boolean;
  answer: string | null;
  failureReason: string | null;
  model: string | null;
  sources: Array<{ name: string; url?: string }>;
  shouldAnswer: boolean;
};

function buildContexts(result: KnowledgeSearchResult): AIContext[] {
  const content = result.sourceQuote ?? result.answerFull ?? result.answerShort;

  if (!content?.trim() || !result.faqId) {
    return [];
  }

  return [
    {
      content,
      sourceName: result.sourceName ?? undefined,
      sourceUrl: result.sourceUrl ?? undefined,
      title: result.question ?? undefined
    }
  ];
}

export async function composeWorkerAnswer({
  aiProvider,
  question,
  result
}: {
  aiProvider: AIProvider | null;
  question: string;
  result: KnowledgeSearchResult;
}): Promise<WorkerAIComposition> {
  const contexts = buildContexts(result);
  const directAnswer = result.answerShort;
  const base = {
    aiProvider: aiProvider?.providerName ?? null,
    model: aiProvider?.modelName ?? null
  };

  if (!directAnswer || !result.faqId) {
    return {
      ...base,
      aiUsed: false,
      answer: null,
      failureReason: "no_verified_context",
      shouldAnswer: false,
      sources: []
    };
  }

  if (result.confidence >= 90) {
    return {
      ...base,
      aiUsed: false,
      answer: directAnswer,
      failureReason: "high_confidence_direct_answer",
      shouldAnswer: true,
      sources: result.sourceName
        ? [{ name: result.sourceName, ...(result.sourceUrl ? { url: result.sourceUrl } : {}) }]
        : []
    };
  }

  if (result.confidence < 70) {
    return {
      ...base,
      aiUsed: false,
      answer: null,
      failureReason: "confidence_below_ai_threshold",
      shouldAnswer: false,
      sources: []
    };
  }

  if (contexts.length === 0) {
    return {
      ...base,
      aiUsed: false,
      answer: null,
      failureReason: "empty_contexts",
      shouldAnswer: false,
      sources: []
    };
  }

  if (!aiProvider) {
    return {
      ...base,
      aiUsed: false,
      answer: directAnswer,
      failureReason: "ai_provider_not_configured",
      shouldAnswer: true,
      sources: result.sourceName
        ? [{ name: result.sourceName, ...(result.sourceUrl ? { url: result.sourceUrl } : {}) }]
        : []
    };
  }

  try {
    const aiAnswer = await aiProvider.generateAnswer({
      contexts,
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
  } catch (error) {
    void error;

    return {
      ...base,
      aiUsed: false,
      answer: directAnswer,
      failureReason: "ai_provider_failed",
      shouldAnswer: true,
      sources: result.sourceName
        ? [{ name: result.sourceName, ...(result.sourceUrl ? { url: result.sourceUrl } : {}) }]
        : []
    };
  }
}
