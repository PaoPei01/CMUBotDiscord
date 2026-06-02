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
  answerFull: string | null;
  answerShort: string | null;
  audience: string | null;
  category: string | null;
  confidence: number;
  facultyGroup: string | null;
  faqId: string | null;
  matchedQuestion: string | null;
  method: SearchMethod;
  priority: string | null;
  source: Source | null;
  sourcePage: string | null;
  sourceQuote: string | null;
  status: string | null;
  validFrom: string | null;
  validUntil: string | null;
};

export type KnowledgeEntry = {
  aliases: string[];
  answer: string;
  answerFull: string | null;
  answerShort: string;
  audience: string | null;
  category: string;
  facultyGroup: string | null;
  faqId: string;
  keywords: string[];
  priority: string | null;
  question: string;
  source: Source | null;
  sourcePage: string | null;
  sourceQuote: string | null;
  status: string;
  updatedAt: string;
  validFrom: string | null;
  validUntil: string | null;
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
