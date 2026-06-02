import { findSimilarKnowledgeByEmbedding } from "@campus-qa/database";

import { createEmbeddingProvider, createScriptDatabaseService } from "./scriptUtils.js";

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(" ").trim();

  if (!question) {
    throw new Error("Usage: pnpm embeddings:search <question>");
  }

  const database = createScriptDatabaseService();
  const provider = createEmbeddingProvider();
  const embedding = await provider.embed(question);
  const matches = await findSimilarKnowledgeByEmbedding(database, {
    embedding,
    limit: 5,
    modelName: provider.modelName
  });

  if (matches.length === 0) {
    console.log("No similar verified FAQ embeddings found.");
    return;
  }

  for (const match of matches) {
    console.log(
      [
        `FAQ: ${match.faqId}`,
        `Similarity: ${match.similarity.toFixed(3)}`,
        `Question: ${match.question}`,
        `Source: ${match.source?.name ?? "No source"}`
      ].join("\n")
    );
    console.log("");
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
