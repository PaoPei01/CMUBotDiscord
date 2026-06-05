import type { AIContext, AIProvider } from "@campus-qa/ai";
import { applyVerifiedAnswerPolicy } from "@campus-qa/ai";

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
  const policyResult = await applyVerifiedAnswerPolicy({
    aiProvider,
    confidence: result.confidence,
    contexts,
    directAnswer,
    faqId: result.faqId,
    question,
    sources: result.sourceName
      ? [{ name: result.sourceName, ...(result.sourceUrl ? { url: result.sourceUrl } : {}) }]
      : []
  });

  return {
    aiProvider: policyResult.aiProvider,
    aiUsed: policyResult.aiUsed,
    answer: policyResult.answer,
    failureReason: policyResult.failureReason,
    model: policyResult.model,
    shouldAnswer: policyResult.shouldAnswer,
    sources: policyResult.sources
  };
}
