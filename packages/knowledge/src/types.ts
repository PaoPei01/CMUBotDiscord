import type { Source } from "@campus-qa/database";

export type SearchMethod =
  | "exact"
  | "alias"
  | "keyword"
  | "full_text"
  | "fuzzy"
  | "vector"
  | "none";

export type SearchResult = {
  answer: string | null;
  confidence: number;
  faqId: string | null;
  matchedQuestion: string | null;
  method: SearchMethod;
  source: Source | null;
};

export type KnowledgeEntry = {
  aliases: string[];
  answer: string;
  category: string;
  faqId: string;
  keywords: string[];
  question: string;
  source: Source | null;
  updatedAt: string;
};

export type KnowledgeRepository = {
  getKnowledgeEntries(): Promise<KnowledgeEntry[]>;
};

export type VectorKnowledgeMatch = KnowledgeEntry & {
  similarity: number;
};

export type VectorKnowledgeRepository = {
  findSimilarByEmbedding(input: {
    embedding: number[];
    limit?: number;
    modelName: string;
  }): Promise<VectorKnowledgeMatch[]>;
};

export type KnowledgeSearchResult = SearchResult;
