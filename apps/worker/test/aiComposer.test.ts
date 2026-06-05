import type { AIProvider } from "@campus-qa/ai";
import { describe, expect, it, vi } from "vitest";

import { composeWorkerAnswer } from "../src/services/aiComposer.js";
import type { KnowledgeSearchResult } from "../src/services/knowledgeSearch.js";

function searchResult(overrides: Partial<KnowledgeSearchResult> = {}): KnowledgeSearchResult {
  return {
    answerFull: "Detailed verified answer",
    answerShort: "Short verified answer",
    audience: "students",
    category: "Admissions",
    confidence: 80,
    facultyGroup: null,
    faqId: "faq-1",
    lastVerifiedAt: "2026-06-02T00:00:00Z",
    matchedReason: "test match",
    method: "keyword",
    priority: "medium",
    question: "Verified question",
    sourceName: "Verified Source",
    sourcePage: "Page 1",
    sourceQuote: "Explicit verified context",
    sourceUrl: "https://example.edu",
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
      answer: "AI rewritten answer from context",
      sources: [{ name: "Verified Source", url: "https://example.edu" }],
      usedContext: true
    })
  );

  return {
    generateAnswer,
    modelName: "gemini-test",
    providerName: "gemini"
  };
}

describe("composeWorkerAnswer", () => {
  it("does not call AI when confidence is at least 90", async () => {
    const aiProvider = provider();
    const result = await composeWorkerAnswer({
      aiProvider,
      question: "question",
      result: searchResult({ confidence: 95, method: "exact" })
    });

    expect(aiProvider.generateAnswer).not.toHaveBeenCalled();
    expect(result.answer).toBe("Short verified answer");
    expect(result.failureReason).toBe("high_confidence_direct_answer");
  });

  it("does not call AI when confidence is below 70", async () => {
    const aiProvider = provider();
    const result = await composeWorkerAnswer({
      aiProvider,
      question: "question",
      result: searchResult({ confidence: 65 })
    });

    expect(aiProvider.generateAnswer).not.toHaveBeenCalled();
    expect(result.shouldAnswer).toBe(false);
    expect(result.failureReason).toBe("confidence_below_answer_threshold");
  });

  it("does not call AI when contexts are empty", async () => {
    const aiProvider = provider();
    const result = await composeWorkerAnswer({
      aiProvider,
      question: "question",
      result: searchResult({
        answerFull: null,
        answerShort: null,
        sourceQuote: null
      })
    });

    expect(aiProvider.generateAnswer).not.toHaveBeenCalled();
    expect(result.shouldAnswer).toBe(false);
    expect(result.failureReason).toBe("no_verified_context");
  });

  it("calls AI when confidence is 70-89 and contexts exist", async () => {
    const aiProvider = provider();
    const result = await composeWorkerAnswer({
      aiProvider,
      question: "student question",
      result: searchResult({ confidence: 80 })
    });

    expect(aiProvider.generateAnswer).toHaveBeenCalledWith({
      contexts: [
        {
          content: "Explicit verified context",
          sourceName: "Verified Source",
          sourceUrl: "https://example.edu",
          title: "Verified question"
        }
      ],
      question: "student question"
    });
    expect(result.aiUsed).toBe(true);
    expect(result.answer).toBe("AI rewritten answer from context");
  });

  it("falls back safely when AI fails", async () => {
    const aiProvider = provider();
    aiProvider.generateAnswer.mockRejectedValueOnce(new Error("secret-test-key failure"));

    const result = await composeWorkerAnswer({
      aiProvider,
      question: "question",
      result: searchResult({ confidence: 80 })
    });

    expect(result.aiUsed).toBe(false);
    expect(result.answer).toBe("Short verified answer");
    expect(result.failureReason).toBe("ai_provider_failed");
    expect(JSON.stringify(result)).not.toContain("secret-test-key");
  });
});
