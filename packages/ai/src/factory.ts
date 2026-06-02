import type { AIProvider } from "./provider.js";
import { GeminiProvider, GroqProvider } from "./providers.js";

export type AIProviderFactoryEnv = {
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
};

export function createAIProviderFromEnv(env: AIProviderFactoryEnv): AIProvider | null {
  const provider = env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === "gemini") {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
    }

    return new GeminiProvider({ apiKey: env.GEMINI_API_KEY });
  }

  if (provider === "groq") {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq");
    }

    return new GroqProvider({ apiKey: env.GROQ_API_KEY });
  }

  if (provider) {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }

  if (env.GROQ_API_KEY) {
    return new GroqProvider({ apiKey: env.GROQ_API_KEY });
  }

  if (env.GEMINI_API_KEY) {
    return new GeminiProvider({ apiKey: env.GEMINI_API_KEY });
  }

  return null;
}
