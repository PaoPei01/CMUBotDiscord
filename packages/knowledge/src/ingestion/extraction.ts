import { AI_NOT_FOUND_MESSAGE } from "@campus-qa/ai";

import type { ExtractedFAQ, FAQExtractionProvider } from "./types.js";

export const FAQ_EXTRACTION_PROMPT = [
  "You are a university knowledge engineer.",
  "",
  "Analyze the content.",
  "",
  "Generate possible FAQ entries only from explicit information in the text.",
  "",
  "Output only valid JSON. Prefer this object shape:",
  "",
  "{",
  '  "faqs": [',
  "    {",
  '      "question": "",',
  '      "answer": "",',
  '      "keywords": [],',
  '      "category": "",',
  '      "confidence": 0',
  "    }",
  "  ]",
  "}",
  "",
  "The legacy raw array shape is also accepted:",
  "",
  "[",
  "  {",
  '    "question": "",',
  '    "answer": "",',
  '    "keywords": [],',
  '    "category": "",',
  '    "confidence": 0',
  "  }",
  "]",
  "",
  "Do not invent facts.",
  "Do not infer missing details.",
  "Do not generate FAQ if information is unclear."
].join("\n");

type ProviderOptions = {
  apiKey: string;
  modelName?: string;
};

type ExtractionProviderEnv = {
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function buildPrompt(chunk: string): string {
  return `${FAQ_EXTRACTION_PROMPT}\n\nContent:\n${chunk}`;
}

function stripMarkdownFence(rawText: string): string {
  const trimmed = rawText.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?/iu, "").replace(/```$/u, "").trim();
}

function extractJsonCandidate(rawText: string): string {
  const text = stripMarkdownFence(rawText);

  if (text.startsWith("[") || text.startsWith("{")) {
    return text;
  }

  const arrayStart = text.indexOf("[");
  const objectStart = text.indexOf("{");
  const starts = [arrayStart, objectStart].filter((index) => index >= 0);

  if (starts.length === 0) {
    throw new Error("FAQ extraction response did not include JSON");
  }

  const start = Math.min(...starts);
  const open = text[start];
  const close = open === "[" ? "]" : "}";
  const end = text.lastIndexOf(close);

  if (end < start) {
    throw new Error("FAQ extraction response JSON was incomplete");
  }

  return text.slice(start, end + 1).trim();
}

function parseJsonBlock(rawText: string): unknown {
  try {
    return JSON.parse(extractJsonCandidate(rawText));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("FAQ extraction response was not valid JSON");
    }

    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseExtractedFAQs(rawText: string): ExtractedFAQ[] {
  const parsed = parseJsonBlock(rawText);
  const entries = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.faqs)
      ? parsed.faqs
      : null;

  if (!entries) {
    throw new Error("FAQ extraction response must include a JSON FAQ array");
  }

  return entries
    .map((entry): ExtractedFAQ | null => {
      if (!isRecord(entry)) {
        return null;
      }

      const question = typeof entry.question === "string" ? entry.question.trim() : "";
      const answer = typeof entry.answer === "string" ? entry.answer.trim() : "";
      const category = typeof entry.category === "string" ? entry.category.trim() : "";
      const confidence = Number(entry.confidence ?? 0);
      const keywords = Array.isArray(entry.keywords)
        ? entry.keywords
            .map((keyword) => (typeof keyword === "string" ? keyword.trim() : ""))
            .filter(Boolean)
        : [];

      if (!question || !answer || !category || answer === AI_NOT_FOUND_MESSAGE) {
        return null;
      }

      return {
        answer,
        category,
        confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 0,
        keywords,
        question
      };
    })
    .filter((entry): entry is ExtractedFAQ => entry !== null);
}

async function errorMessageFromResponse(response: Response): Promise<string> {
  const fallback = `AI extraction request failed with status ${response.status}`;

  try {
    const rawText = await response.text();

    if (!rawText.trim()) {
      return fallback;
    }

    const parsed = JSON.parse(rawText) as unknown;

    if (isRecord(parsed) && isRecord(parsed.error) && typeof parsed.error.message === "string") {
      return `${fallback}: ${parsed.error.message}`;
    }

    return `${fallback}: ${rawText.slice(0, 300)}`;
  } catch {
    return fallback;
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await errorMessageFromResponse(response));
  }

  return (await response.json()) as T;
}

export class GeminiFAQExtractionProvider implements FAQExtractionProvider {
  providerName = "gemini";
  private readonly modelName: string;

  constructor(private readonly options: ProviderOptions) {
    this.modelName = options.modelName ?? "gemini-1.5-flash";
  }

  async extractFAQs({ chunk }: { chunk: string }): Promise<ExtractedFAQ[]> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.options.apiKey}`,
      {
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(chunk) }], role: "user" }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      }
    );
    const data = await readJsonResponse<GeminiResponse>(response);
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini extraction response did not include text");
    }

    return parseExtractedFAQs(rawText);
  }
}

export class GroqFAQExtractionProvider implements FAQExtractionProvider {
  providerName = "groq";
  private readonly modelName: string;

  constructor(private readonly options: ProviderOptions) {
    this.modelName = options.modelName ?? "llama-3.1-8b-instant";
  }

  async extractFAQs({ chunk }: { chunk: string }): Promise<ExtractedFAQ[]> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      body: JSON.stringify({
        messages: [{ content: buildPrompt(chunk), role: "user" }],
        model: this.modelName,
        response_format: { type: "json_object" },
        temperature: 0.1
      }),
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const data = await readJsonResponse<GroqResponse>(response);
    const rawText = data.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Groq extraction response did not include text");
    }

    return parseExtractedFAQs(rawText);
  }
}

export function createFAQExtractionProviderFromEnv(
  env: ExtractionProviderEnv
): FAQExtractionProvider {
  const provider = env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === "gemini" || (!provider && env.GEMINI_API_KEY)) {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required for FAQ extraction");
    }

    return new GeminiFAQExtractionProvider({
      apiKey: env.GEMINI_API_KEY,
      modelName: env.GEMINI_MODEL
    });
  }

  if (provider === "groq" || (!provider && env.GROQ_API_KEY)) {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is required for FAQ extraction");
    }

    return new GroqFAQExtractionProvider({
      apiKey: env.GROQ_API_KEY,
      modelName: env.GROQ_MODEL
    });
  }

  throw new Error("AI_PROVIDER with GEMINI_API_KEY or GROQ_API_KEY is required for FAQ extraction");
}
