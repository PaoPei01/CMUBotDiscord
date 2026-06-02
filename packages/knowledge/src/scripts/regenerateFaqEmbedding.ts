import { getKnowledgeEntries, upsertFaqEmbedding } from "@campus-qa/database";

import { buildEmbeddingContent } from "../index.js";
import {
  createEmbeddingProvider,
  createScriptDatabaseService,
  findEntryByFaqId
} from "./scriptUtils.js";

async function main(): Promise<void> {
  const faqId = process.argv[2];

  if (!faqId) {
    throw new Error("Usage: pnpm embeddings:regenerate <faq-id>");
  }

  const database = createScriptDatabaseService();
  const provider = createEmbeddingProvider();
  const entries = await getKnowledgeEntries(database);
  const entry = findEntryByFaqId(entries, faqId);
  const content = buildEmbeddingContent(entry);
  const embedding = await provider.embed(content);

  await upsertFaqEmbedding(database, {
    content,
    embedding,
    embeddingModel: provider.modelName,
    faqId: entry.faqId
  });

  console.log(`Regenerated embedding for FAQ ${entry.faqId} with ${provider.modelName}.`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
