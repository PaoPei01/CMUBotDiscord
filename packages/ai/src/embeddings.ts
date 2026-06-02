export interface EmbeddingProvider {
  readonly modelName: string;
  embed(text: string): Promise<number[]>;
}

export type GeminiEmbeddingProviderOptions = {
  apiKey: string;
  modelName: string;
};

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly modelName: string;

  constructor(private readonly options: GeminiEmbeddingProviderOptions) {
    this.modelName = options.modelName;
  }

  embed(text: string): Promise<number[]> {
    if (!this.options.apiKey) {
      return Promise.reject(new Error("GEMINI_API_KEY is required to generate embeddings"));
    }

    if (!text.trim()) {
      return Promise.reject(new Error("Embedding text must not be empty"));
    }

    return Promise.reject(
      new Error(
        "GeminiEmbeddingProvider is a placeholder. Add a reviewed Gemini embedding client before generating production embeddings."
      )
    );
  }
}
