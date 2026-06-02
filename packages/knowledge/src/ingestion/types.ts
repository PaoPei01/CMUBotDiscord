import type { FAQ, Source } from "@campus-qa/database";

export type SupportedKnowledgeInput = "pdf" | "docx" | "txt" | "markdown" | "url";

export type ParsedKnowledgeInput = {
  content: string;
  name: string;
  sourceType: SupportedKnowledgeInput;
  url: string | null;
};

export type ChunkingOptions = {
  chunkSizeWords: number;
  overlapWords: number;
};

export type TextChunk = {
  index: number;
  text: string;
  wordCount: number;
};

export type ExtractedFAQ = {
  answer: string;
  category: string;
  confidence: number;
  keywords: string[];
  question: string;
};

export type DraftFAQCandidate = ExtractedFAQ & {
  duplicateConfidence: number;
  duplicateOfDraftId: string | null;
  duplicateOfFaqId: string | null;
  status: "pending" | "duplicate";
};

export type DuplicateCheckFAQ = Pick<FAQ, "id" | "question"> & {
  keywords?: string[];
  source?: Source | null;
};

export type DuplicateCheckDraft = {
  id: string;
  keywords?: string[];
  question: string;
};

export type FAQExtractionProvider = {
  providerName: string;
  extractFAQs(input: { chunk: string }): Promise<ExtractedFAQ[]>;
};

export type ProductionFAQApproval = {
  answer: string;
  category: string;
  keywords: string[];
  question: string;
  sourceName: string;
  sourceUrl: string | null;
};
