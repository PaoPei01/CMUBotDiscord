import { AI_NOT_FOUND_MESSAGE, buildAnswerPrompt } from "./promptTemplates.js";
import type { AIProvider, AIProviderAnswer, AIProviderInput, AISource } from "./types.js";

type GeminiProviderOptions = {
  apiKey: string;
  modelName?: string;
};

type GroqProviderOptions = {
  apiKey: string;
  modelName?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
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

function assertContexts(input: AIProviderInput): void {
  if (input.contexts.length === 0) {
    throw new Error("AI answer generation requires verified contexts");
  }

  for (const context of input.contexts) {
    if (!context.content.trim()) {
      throw new Error("AI context content must not be empty");
    }
  }
}

function contextSources(input: AIProviderInput): AISource[] {
  const sources = new Map<string, AISource>();

  for (const context of input.contexts) {
    const sourceName = context.sourceName?.trim();

    if (!sourceName) {
      continue;
    }

    sources.set(sourceName, {
      name: sourceName,
      ...(context.sourceUrl ? { url: context.sourceUrl } : {})
    });
  }

  return [...sources.values()];
}

function guardAnswer(rawAnswer: string, input: AIProviderInput): AIProviderAnswer {
  assertContexts(input);

  const answer = rawAnswer.trim();

  if (!answer || answer === AI_NOT_FOUND_MESSAGE) {
    return {
      answer: AI_NOT_FOUND_MESSAGE,
      sources: [],
      usedContext: false
    };
  }

  return {
    answer,
    sources: contextSources(input),
    usedContext: true
  };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`AI provider request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export class GeminiProvider implements AIProvider {
  readonly providerName = "gemini";
  readonly modelName: string;

  constructor(private readonly options: GeminiProviderOptions) {
    this.modelName = options.modelName ?? "gemini-1.5-flash";
  }

  async generateAnswer(input: AIProviderInput): Promise<AIProviderAnswer> {
    assertContexts(input);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.options.apiKey}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildAnswerPrompt(input) }],
              role: "user"
            }
          ],
          generationConfig: {
            temperature: 0.1
          }
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    const data = await readJsonResponse<GeminiResponse>(response);
    const rawAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawAnswer) {
      throw new Error("Gemini response did not include answer text");
    }

    return guardAnswer(rawAnswer, input);
  }
}

export class GroqProvider implements AIProvider {
  readonly providerName = "groq";
  readonly modelName: string;

  constructor(private readonly options: GroqProviderOptions) {
    this.modelName = options.modelName ?? "llama-3.1-8b-instant";
  }

  async generateAnswer(input: AIProviderInput): Promise<AIProviderAnswer> {
    assertContexts(input);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      body: JSON.stringify({
        messages: [
          {
            content: buildAnswerPrompt(input),
            role: "user"
          }
        ],
        model: this.modelName,
        temperature: 0.1
      }),
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const data = await readJsonResponse<GroqResponse>(response);
    const rawAnswer = data.choices?.[0]?.message?.content;

    if (!rawAnswer) {
      throw new Error("Groq response did not include answer text");
    }

    return guardAnswer(rawAnswer, input);
  }
}
