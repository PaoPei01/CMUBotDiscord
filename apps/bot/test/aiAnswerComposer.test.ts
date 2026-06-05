import type { AIProvider } from "@campus-qa/ai";
import type { SearchResult } from "@campus-qa/knowledge";
import { describe, expect, it, vi } from "vitest";

import { composeAskAnswer } from "../src/services/aiAnswerComposer.js";

const source = {
  createdAt: "2026-06-02T00:00:00Z",
  id: "source-1",
  lastVerifiedAt: "2026-06-02T00:00:00Z",
  name: "Verified Source",
  sourceType: "website",
  updatedAt: "2026-06-02T00:00:00Z",
  url: "https://example.edu"
};

function searchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  const answer = "Verified answer";

  return {
    answer,
    answerFull: answer,
    answerShort: answer,
    audience: "นักศึกษา",
    category: "ทั่วไป",
    confidence: 80,
    facultyGroup: null,
    faqId: "faq-1",
    matchedQuestion: "Verified question",
    method: "keyword",
    priority: "medium",
    source,
    sourcePage: null,
    sourceQuote: null,
    status: "active",
    validFrom: null,
    validUntil: null,
    ...overrides
  };
}

type TestAIProvider = AIProvider & {
  generateAnswer: ReturnType<typeof vi.fn<AIProvider["generateAnswer"]>>;
};

function provider(): TestAIProvider {
  const generateAnswer = vi.fn<AIProvider["generateAnswer"]>(() =>
    Promise.resolve({
      answer: "Rewritten verified answer",
      sources: [{ name: "Verified Source", url: "https://example.edu" }],
      usedContext: true
    })
  );

  return {
    generateAnswer,
    modelName: "test-model",
    providerName: "test"
  };
}

describe("composeAskAnswer", () => {
  it("does not call AI when confidence is low", async () => {
    const aiProvider = provider();
    const result = await composeAskAnswer({
      aiProvider,
      question: "question",
      searchResult: searchResult({ confidence: 69 })
    });

    expect(aiProvider.generateAnswer).not.toHaveBeenCalled();
    expect(result.shouldReplyWithAnswer).toBe(false);
    expect(result.failureReason).toBe("confidence_below_answer_threshold");
  });

  it("does not call AI when no context exists", async () => {
    const aiProvider = provider();
    const result = await composeAskAnswer({
      aiProvider,
      question: "question",
      searchResult: searchResult({ source: null })
    });

    expect(aiProvider.generateAnswer).not.toHaveBeenCalled();
    expect(result.promptContextCount).toBe(0);
    expect(result.shouldReplyWithAnswer).toBe(false);
    expect(result.failureReason).toBe("no_verified_context");
  });

  it("passes only retrieved verified context to AI", async () => {
    const aiProvider = provider();
    const result = await composeAskAnswer({
      aiProvider,
      question: "student question",
      searchResult: searchResult()
    });

    expect(aiProvider.generateAnswer).toHaveBeenCalledWith({
      contexts: [
        {
          content: "Verified answer",
          sourceName: "Verified Source",
          sourceUrl: "https://example.edu",
          title: "Verified question"
        }
      ],
      question: "student question"
    });
    expect(result.result.answerShort).toBe("Rewritten verified answer");
  });

  it("falls back to verified FAQ answer when provider fails", async () => {
    const aiProvider = provider();
    aiProvider.generateAnswer.mockRejectedValueOnce(new Error("provider failed"));

    const result = await composeAskAnswer({
      aiProvider,
      question: "question",
      searchResult: searchResult()
    });

    expect(result.aiUsed).toBe(false);
    expect(result.result.answer).toBe("Verified answer");
    expect(result.shouldReplyWithAnswer).toBe(true);
    expect(result.failureReason).toBe("ai_provider_failed");
  });
});
