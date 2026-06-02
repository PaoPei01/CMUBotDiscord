import type { AIProvider, AIProviderFactoryEnv } from "./types.js";
import { GeminiProvider, GroqProvider } from "./providers.js";

export class AIProviderFactory {
  static fromEnv(env: AIProviderFactoryEnv): AIProvider | null {
    const provider = env.AI_PROVIDER?.trim().toLowerCase();

    if (provider === "gemini") {
      if (!env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
      }

      return new GeminiProvider({
        apiKey: env.GEMINI_API_KEY,
        modelName: env.GEMINI_MODEL
      });
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

    if (env.GEMINI_API_KEY) {
      return new GeminiProvider({
        apiKey: env.GEMINI_API_KEY,
        modelName: env.GEMINI_MODEL
      });
    }

    if (env.GROQ_API_KEY) {
      return new GroqProvider({ apiKey: env.GROQ_API_KEY });
    }

    return null;
  }
}

export function createAIProviderFromEnv(env: AIProviderFactoryEnv): AIProvider | null {
  return AIProviderFactory.fromEnv(env);
}
