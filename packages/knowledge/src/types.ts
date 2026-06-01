import type { Citation } from "@campus-qa/shared";

export type KnowledgeSearchResult = {
  faqId: string;
  answer: string;
  citations: Citation[];
  score: number;
};
