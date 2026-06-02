import { GeminiEmbeddingProvider, type EmbeddingProvider } from "@campus-qa/ai";
import { createSupabaseDatabaseService } from "@campus-qa/database";
import type { DatabaseServiceClient, KnowledgeEntryRow } from "@campus-qa/database";

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function createScriptDatabaseService(): DatabaseServiceClient {
  return createSupabaseDatabaseService({
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: requireEnv("SUPABASE_URL")
  });
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER ?? "gemini";
  const modelName = requireEnv("EMBEDDING_MODEL");

  if (provider !== "gemini") {
    throw new Error(`Unsupported EMBEDDING_PROVIDER: ${provider}`);
  }

  return new GeminiEmbeddingProvider({
    apiKey: requireEnv("GEMINI_API_KEY"),
    modelName
  });
}

export function findEntryByFaqId(
  entries: KnowledgeEntryRow[],
  faqId: string
): KnowledgeEntryRow {
  const entry = entries.find((candidate) => candidate.faqId === faqId);

  if (!entry) {
    throw new Error(`Active FAQ not found: ${faqId}`);
  }

  return entry;
}
