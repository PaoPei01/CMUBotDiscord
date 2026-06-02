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
  return {
    answer: "Verified answer",
    confidence: 80,
    faqId: "faq-1",
    matchedQuestion: "Verified question",
    method: "keyword",
    source,
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
      citedSourceNames: ["Verified Source"],
      notFound: false
    })
  );

  return {
    generateAnswer,
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
    expect(result.failureReason).toBe("confidence_below_ai_threshold");
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
    await composeAskAnswer({
      aiProvider,
      question: "student question",
      searchResult: searchResult()
    });

    expect(aiProvider.generateAnswer).toHaveBeenCalledWith({
      contexts: [
        {
          answer: "Verified answer",
          faqId: "faq-1",
          question: "Verified question",
          sourceName: "Verified Source",
          sourceUrl: "https://example.edu"
        }
      ],
      question: "student question"
    });
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
    expect(result.failureReason).toBe("provider failed");
  });
});
