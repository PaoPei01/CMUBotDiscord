import { describe, expect, it } from "vitest";

import {
  approveDraftForProduction,
  chunkText,
  createDraftCandidates,
  generateDraftFAQsFromParsedInput,
  normalizeParsedText,
  parseExtractedFAQs,
  stripHtml,
  validateFileInput
} from "../src/index.js";
import type { FAQExtractionProvider } from "../src/index.js";

describe("knowledge parsers", () => {
  it("validates supported file types and size limits", () => {
    const sourceType = validateFileInput({
      bytes: new TextEncoder().encode("hello"),
      fileName: "faq.md",
      maxBytes: 100
    });

    expect(sourceType).toBe("markdown");
    expect(() =>
      validateFileInput({
        bytes: new TextEncoder().encode("hello"),
        fileName: "faq.exe",
        maxBytes: 100
      })
    ).toThrow("Unsupported knowledge file type");
  });

  it("normalizes text and strips URL HTML content", () => {
    expect(normalizeParsedText("  hello \n world  ")).toBe("hello world");
    expect(stripHtml("<main>FAQ <strong>answer</strong></main>")).toContain(
      "FAQ  answer"
    );
  });
});

describe("knowledge chunking", () => {
  it("chunks text with overlap", () => {
    const chunks = chunkText("one two three four five six", {
      chunkSizeWords: 4,
      overlapWords: 1
    });

    expect(chunks).toEqual([
      { index: 0, text: "one two three four", wordCount: 4 },
      { index: 1, text: "four five six", wordCount: 3 }
    ]);
  });
});

describe("draft creation", () => {
  it("creates draft candidates from extracted explicit FAQs", async () => {
    const provider: FAQExtractionProvider = {
      extractFAQs() {
        return Promise.resolve([
          {
            answer: "Submit documents by Friday.",
            category: "Admissions",
            confidence: 88,
            keywords: ["documents"],
            question: "When are documents due?"
          }
        ]);
      },
      providerName: "test"
    };

    const result = await generateDraftFAQsFromParsedInput({
      existingDrafts: [],
      existingFaqs: [],
      input: {
        content: "Students must submit documents by Friday.",
        name: "test.txt",
        sourceType: "txt",
        url: null
      },
      options: { chunkSizeWords: 1000, overlapWords: 150 },
      provider
    });

    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.status).toBe("pending");
  });

  it("parses FAQ extraction JSON arrays", () => {
    const faqs = parseExtractedFAQs(
      '[{"question":"Q","answer":"A","keywords":["k"],"category":"C","confidence":91}]'
    );

    expect(faqs[0]).toMatchObject({
      answer: "A",
      category: "C",
      confidence: 91,
      question: "Q"
    });
  });

  it("parses FAQ extraction JSON objects", () => {
    const faqs = parseExtractedFAQs(
      '{"faqs":[{"question":"Q","answer":"A","keywords":[],"category":"C","confidence":82}]}'
    );

    expect(faqs[0]).toMatchObject({
      answer: "A",
      category: "C",
      confidence: 82,
      question: "Q"
    });
  });

  it("reports invalid FAQ extraction JSON safely", () => {
    expect(() => parseExtractedFAQs("_not json_")).toThrow(
      "FAQ extraction response did not include JSON"
    );
  });
});

describe("duplicate detection", () => {
  it("marks exact FAQ question matches as duplicates", () => {
    const [candidate] = createDraftCandidates({
      existingDrafts: [],
      existingFaqs: [
        {
          id: "faq-1",
          question: "When are documents due?"
        }
      ],
      extractedFaqs: [
        {
          answer: "Submit documents by Friday.",
          category: "Admissions",
          confidence: 88,
          keywords: ["documents"],
          question: "When are documents due?"
        }
      ]
    });

    expect(candidate?.status).toBe("duplicate");
    expect(candidate?.duplicateConfidence).toBe(100);
    expect(candidate?.duplicateOfFaqId).toBe("faq-1");
  });
});

describe("approval workflow", () => {
  it("normalizes an approved draft before production copy", () => {
    const approved = approveDraftForProduction({
      answer: " Answer ",
      category: " Category ",
      keywords: [" one ", "one", "two"],
      question: " Question ",
      sourceName: " Source ",
      sourceUrl: ""
    });

    expect(approved).toEqual({
      answer: "Answer",
      category: "Category",
      keywords: ["one", "two"],
      question: "Question",
      sourceName: "Source",
      sourceUrl: null
    });
  });
});
