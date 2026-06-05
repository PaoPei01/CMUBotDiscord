import type { AIContext, AIProvider } from "@campus-qa/ai";
import { applyVerifiedAnswerPolicy } from "@campus-qa/ai";
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
  const policyResult = await applyVerifiedAnswerPolicy({
    aiProvider,
    confidence: searchResult.confidence,
    contexts,
    directAnswer: searchResult.answerShort ?? searchResult.answer,
    faqId: searchResult.faqId,
    question,
    sources: searchResult.source?.name
      ? [
          {
            name: searchResult.source.name,
            ...(searchResult.source.url ? { url: searchResult.source.url } : {})
          }
        ]
      : []
  });

  return {
    aiProvider: policyResult.aiProvider,
    aiUsed: policyResult.aiUsed,
    failureReason: policyResult.failureReason,
    promptContextCount: policyResult.promptContextCount,
    result: {
      ...searchResult,
      ...(policyResult.answer
        ? { answer: policyResult.answer, answerShort: policyResult.answer }
        : {})
    },
    shouldReplyWithAnswer: policyResult.shouldAnswer
  };
}
