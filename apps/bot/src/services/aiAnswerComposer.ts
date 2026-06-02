import type { AIContext, AIProvider } from "@campus-qa/ai";
import type { SearchResult } from "@campus-qa/knowledge";

export type AnswerCompositionResult = {
  aiProvider: string | null;
  aiUsed: boolean;
  failureReason: string | null;
  promptContextCount: number;
  result: SearchResult;
  shouldReplyWithAnswer: boolean;
};

function buildRetrievedContexts(result: SearchResult): AIContext[] {
  const content = result.sourceQuote ?? result.answerFull ?? result.answerShort ?? result.answer;

  if (!content || !result.faqId || !result.matchedQuestion || !result.source?.name) {
    return [];
  }

  return [
    {
      content,
      sourceName: result.source.name,
      sourceUrl: result.source.url ?? undefined,
      title: result.matchedQuestion
    }
  ];
}

export async function composeAskAnswer({
  aiProvider,
  question,
  searchResult
}: {
  aiProvider: AIProvider | null;
  question: string;
  searchResult: SearchResult;
}): Promise<AnswerCompositionResult> {
  const contexts = buildRetrievedContexts(searchResult);
  const base = {
    aiProvider: aiProvider?.providerName ?? null,
    promptContextCount: contexts.length,
    result: searchResult
  };

  if (!searchResult.answer || !searchResult.faqId) {
    return {
      ...base,
      aiUsed: false,
      failureReason: "no_retrieved_answer",
      shouldReplyWithAnswer: false
    };
  }

  if (searchResult.confidence >= 90) {
    return {
      ...base,
      aiUsed: false,
      failureReason: "high_confidence_direct_answer",
      shouldReplyWithAnswer: true
    };
  }

  if (searchResult.confidence < 70) {
    return {
      ...base,
      aiUsed: false,
      failureReason: "confidence_below_ai_threshold",
      shouldReplyWithAnswer: false
    };
  }

  if (contexts.length === 0) {
    return {
      ...base,
      aiUsed: false,
      failureReason: "no_verified_context",
      shouldReplyWithAnswer: false
    };
  }

  if (!aiProvider) {
    return {
      ...base,
      aiUsed: false,
      failureReason: "ai_provider_not_configured",
      shouldReplyWithAnswer: true
    };
  }

  try {
    const aiAnswer = await aiProvider.generateAnswer({
      contexts,
      question
    });

    if (!aiAnswer.usedContext) {
      return {
        ...base,
        aiUsed: true,
        failureReason: "ai_reported_insufficient_context",
        shouldReplyWithAnswer: false
      };
    }

    return {
      ...base,
      aiUsed: true,
      failureReason: null,
      result: {
        ...searchResult,
        answer: aiAnswer.answer
      },
      shouldReplyWithAnswer: true
    };
  } catch (error) {
    return {
      ...base,
      aiUsed: false,
      failureReason: error instanceof Error ? error.message : "ai_provider_failed",
      shouldReplyWithAnswer: true
    };
  }
}
