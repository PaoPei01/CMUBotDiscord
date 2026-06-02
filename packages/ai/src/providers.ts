import { buildAnswerPrompt } from "./prompt.js";
import { assertRetrievedContexts, guardAIAnswer, parseAIAnswer } from "./safety.js";
import type { AIGenerateAnswerInput, AIAnswer, AIProvider } from "./provider.js";

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

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`AI provider request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export class GeminiProvider implements AIProvider {
  readonly providerName = "gemini";
  private readonly modelName: string;

  constructor(private readonly options: GeminiProviderOptions) {
    this.modelName = options.modelName ?? "gemini-1.5-flash";
  }

  async generateAnswer(input: AIGenerateAnswerInput): Promise<AIAnswer> {
    assertRetrievedContexts(input.contexts);

    const prompt = buildAnswerPrompt(input);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.options.apiKey}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
              role: "user"
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
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
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini response did not include answer text");
    }

    return guardAIAnswer(parseAIAnswer(rawText), input.contexts);
  }
}

export class GroqProvider implements AIProvider {
  readonly providerName = "groq";
  private readonly modelName: string;

  constructor(private readonly options: GroqProviderOptions) {
    this.modelName = options.modelName ?? "llama-3.1-8b-instant";
  }

  async generateAnswer(input: AIGenerateAnswerInput): Promise<AIAnswer> {
    assertRetrievedContexts(input.contexts);

    const prompt = buildAnswerPrompt(input);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      body: JSON.stringify({
        messages: [
          {
            content: prompt,
            role: "user"
          }
        ],
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
      throw new Error("Groq response did not include answer text");
    }

    return guardAIAnswer(parseAIAnswer(rawText), input.contexts);
  }
}
