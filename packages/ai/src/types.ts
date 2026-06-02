export type AIContext = {
  title?: string;
  content: string;
  sourceName?: string;
  sourceUrl?: string;
};

export type AIProviderInput = {
  question: string;
  contexts: AIContext[];
};

export type AISource = {
  name: string;
  url?: string;
};

export type AIProviderAnswer = {
  answer: string;
  usedContext: boolean;
  sources: AISource[];
};

export interface AIProvider {
  readonly providerName: string;
  readonly modelName: string;
  generateAnswer(input: AIProviderInput): Promise<AIProviderAnswer>;
}

export type AIProviderFactoryEnv = {
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GROQ_API_KEY?: string;
};
