import { chunkText, defaultChunkingOptions } from "./chunking.js";
import { createDraftCandidates } from "./duplicates.js";
import type {
  ChunkingOptions,
  DraftFAQCandidate,
  DuplicateCheckDraft,
  DuplicateCheckFAQ,
  FAQExtractionProvider,
  ParsedKnowledgeInput,
  ProductionFAQApproval
} from "./types.js";

export async function generateDraftFAQsFromParsedInput({
  existingDrafts,
  existingFaqs,
  input,
  options = defaultChunkingOptions,
  provider
}: {
  existingDrafts: DuplicateCheckDraft[];
  existingFaqs: DuplicateCheckFAQ[];
  input: ParsedKnowledgeInput;
  options?: ChunkingOptions;
  provider: FAQExtractionProvider;
}): Promise<{
  chunksProcessed: number;
  drafts: DraftFAQCandidate[];
  providerName: string;
}> {
  const chunks = chunkText(input.content, options);
  const extracted = [];

  for (const chunk of chunks) {
    extracted.push(...(await provider.extractFAQs({ chunk: chunk.text })));
  }

  return {
    chunksProcessed: chunks.length,
    drafts: createDraftCandidates({
      existingDrafts,
      existingFaqs,
      extractedFaqs: extracted
    }),
    providerName: provider.providerName
  };
}

export function approveDraftForProduction({
  answer,
  category,
  keywords,
  question,
  sourceName,
  sourceUrl
}: ProductionFAQApproval): ProductionFAQApproval {
  const cleanKeywords = [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))];

  if (!question.trim() || !answer.trim() || !category.trim()) {
    throw new Error("Draft question, answer, and category are required for approval");
  }

  if (!sourceName.trim()) {
    throw new Error("A source name is required before approving a draft");
  }

  return {
    answer: answer.trim(),
    category: category.trim(),
    keywords: cleanKeywords,
    question: question.trim(),
    sourceName: sourceName.trim(),
    sourceUrl: sourceUrl?.trim() || null
  };
}
