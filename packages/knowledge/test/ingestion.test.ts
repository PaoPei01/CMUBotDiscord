import { afterEach, describe, expect, it, vi } from "vitest";

import {
  approveDraftForProduction,
  chunkText,
  createDraftCandidates,
  FAQ_EXTRACTION_PROMPT,
  GeminiFAQExtractionProvider,
  generateDraftFAQsFromParsedInput,
  GroqFAQExtractionProvider,
  normalizeParsedText,
  parseExtractedFAQs,
  stripHtml,
  validateFileInput
} from "../src/index.js";
import type { FAQExtractionProvider } from "../src/index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function requestBodyAt(fetchMock: ReturnType<typeof vi.fn>, index: number): Record<string, unknown> {
  const init = fetchMock.mock.calls[index]?.[1] as RequestInit | undefined;

  if (typeof init?.body !== "string") {
    throw new Error("Expected fetch body to be a JSON string");
  }

  return JSON.parse(init.body) as Record<string, unknown>;
}

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
  it("instructs extraction providers to return JSON only", () => {
    expect(FAQ_EXTRACTION_PROMPT).toContain("Return JSON only");
    expect(FAQ_EXTRACTION_PROMPT).toContain('{"faqs":[]}');
    expect(FAQ_EXTRACTION_PROMPT).toContain("Never answer with natural language");
  });

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

  it("includes provider error details when AI extraction requests fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                message: "model is not supported for generateContent"
              }
            }),
            { status: 400 }
          )
        )
      )
    );

    const provider = new GeminiFAQExtractionProvider({
      apiKey: "test-api-key",
      modelName: "bad-model"
    });

    await expect(provider.extractFAQs({ chunk: "verified content" })).rejects.toThrow(
      "AI extraction request failed with status 400: model is not supported for generateContent"
    );
  });

  it("retries Groq extraction without JSON mode when JSON mode fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              message: "Failed to generate JSON. Please adjust your prompt."
            }
          }),
          { status: 400 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    '{"faqs":[{"question":"Q","answer":"A","keywords":["k"],"category":"C","confidence":88}]}'
                }
              }
            ]
          }),
          { status: 200 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const provider = new GroqFAQExtractionProvider({
      apiKey: "test-api-key",
      modelName: "llama-test"
    });

    await expect(provider.extractFAQs({ chunk: "verified content" })).resolves.toEqual([
      {
        answer: "A",
        category: "C",
        confidence: 88,
        keywords: ["k"],
        question: "Q"
      }
    ]);

    const firstBody = requestBodyAt(fetchMock, 0);
    const secondBody = requestBodyAt(fetchMock, 1);
    const secondMessages = secondBody.messages as Array<{ content: string; role: string }>;

    expect(firstBody.response_format).toEqual({ type: "json_object" });
    expect(secondBody.response_format).toBeUndefined();
    expect(secondMessages[0]?.role).toBe("system");
    expect(secondMessages[0]?.content).toContain("Return only valid JSON");
  });

  it("repairs Groq prose responses into JSON when extraction omitted JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "The document says students must submit photos by Friday."
                }
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    '{"faqs":[{"question":"When are photos due?","answer":"Students must submit photos by Friday.","keywords":["photos"],"category":"Admissions","confidence":87}]}'
                }
              }
            ]
          }),
          { status: 200 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const provider = new GroqFAQExtractionProvider({
      apiKey: "test-api-key",
      modelName: "llama-test"
    });

    await expect(provider.extractFAQs({ chunk: "Students must submit photos by Friday." })).resolves.toEqual([
      {
        answer: "Students must submit photos by Friday.",
        category: "Admissions",
        confidence: 87,
        keywords: ["photos"],
        question: "When are photos due?"
      }
    ]);

    const repairBody = requestBodyAt(fetchMock, 1);
    const repairMessages = repairBody.messages as Array<{ content: string; role: string }>;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(repairMessages[0]?.role).toBe("system");
    expect(repairMessages[1]?.content).toContain("Previous response:");
    expect(repairMessages[1]?.content).toContain("Return JSON only");
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
