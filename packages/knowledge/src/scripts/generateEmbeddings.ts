import {
  getExistingEmbeddingFaqIds,
  getKnowledgeEntries,
  upsertFaqEmbedding
} from "@campus-qa/database";

import { buildEmbeddingContent } from "../index.js";
import { createEmbeddingProvider, createScriptDatabaseService } from "./scriptUtils.js";

async function main(): Promise<void> {
  const database = createScriptDatabaseService();
  const provider = createEmbeddingProvider();
  const [entries, existingFaqIds] = await Promise.all([
    getKnowledgeEntries(database),
    getExistingEmbeddingFaqIds(database, provider.modelName)
  ]);
  const existing = new Set(existingFaqIds);
  let generatedCount = 0;
  let skippedCount = 0;

  for (const entry of entries) {
    if (existing.has(entry.faqId)) {
      skippedCount += 1;
      continue;
    }

    const content = buildEmbeddingContent(entry);
    const embedding = await provider.embed(content);
    await upsertFaqEmbedding(database, {
      content,
      embedding,
      embeddingModel: provider.modelName,
      faqId: entry.faqId
    });
    generatedCount += 1;
  }

  console.log(
    `Generated ${generatedCount} FAQ embeddings with ${provider.modelName}; skipped ${skippedCount} cached embeddings.`
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
