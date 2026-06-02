import Fuse from "fuse.js";

import type {
  KnowledgeEntry,
  KnowledgeRepository,
  SearchMethod,
  SearchResult
} from "./types.js";

export type {
  KnowledgeEntry,
  KnowledgeRepository,
  KnowledgeSearchResult,
  SearchMethod,
  SearchResult
} from "./types.js";

const noneResult: SearchResult = {
  answer: null,
  confidence: 0,
  faqId: null,
  method: "none",
  source: null
};

export function removeRepeatedSpaces(value: string): string {
  return value.replace(/[ \t]+/g, " ");
}

export function normalizeWhitespace(value: string): string {
  return removeRepeatedSpaces(value.replace(/\s+/g, " ")).trim();
}

export function normalizeThaiText(value: string): string {
  return normalizeWhitespace(value.normalize("NFC").replace(/[\u200B-\u200D\uFEFF]/g, ""));
}

export function normalizeSearchText(value: string): string {
  return normalizeThaiText(value).toLocaleLowerCase("en-US");
}

function buildResult(
  entry: KnowledgeEntry,
  method: Exclude<SearchMethod, "none">,
  confidence: number
): SearchResult {
  return {
    answer: entry.answer,
    confidence,
    faqId: entry.faqId,
    method,
    source: entry.source
  };
}

function uniqueTokens(value: string): string[] {
  const normalized = normalizeSearchText(value);
  return [...new Set(normalized.split(" ").filter((token) => token.length >= 2))];
}

function tokenOverlapScore(question: string, entry: KnowledgeEntry): number {
  const questionTokens = uniqueTokens(question);

  if (questionTokens.length === 0) {
    return 0;
  }

  const searchable = normalizeSearchText(
    [
      entry.category,
      entry.question,
      entry.answer,
      ...entry.aliases,
      ...entry.keywords
    ].join(" ")
  );
  const matches = questionTokens.filter((token) => searchable.includes(token)).length;
  return matches / questionTokens.length;
}

export class KnowledgeEngine {
  constructor(private readonly repository: KnowledgeRepository) {}

  async searchKnowledge(question: string): Promise<SearchResult> {
    const normalizedQuestion = normalizeSearchText(question);

    if (!normalizedQuestion) {
      return noneResult;
    }

    const entries = await this.repository.getKnowledgeEntries();

    const exactMatch = entries.find(
      (entry) => normalizeSearchText(entry.question) === normalizedQuestion
    );
    if (exactMatch) {
      return buildResult(exactMatch, "exact", 100);
    }

    const aliasMatch = entries.find((entry) =>
      entry.aliases.some((alias) => normalizeSearchText(alias) === normalizedQuestion)
    );
    if (aliasMatch) {
      return buildResult(aliasMatch, "alias", 93);
    }

    const keywordScores = entries
      .map((entry) => ({
        entry,
        score: entry.keywords.filter((keyword) =>
          normalizedQuestion.includes(normalizeSearchText(keyword))
        ).length
      }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score);

    if (keywordScores[0]) {
      const confidence = Math.min(90, 75 + keywordScores[0].score * 5);
      return buildResult(keywordScores[0].entry, "keyword", confidence);
    }

    // TODO: Replace this deterministic token overlap with PostgreSQL full-text
    // retrieval after a future migration adds a tsvector index or RPC.
    const fullTextScores = entries
      .map((entry) => ({
        entry,
        score: tokenOverlapScore(normalizedQuestion, entry)
      }))
      .filter((result) => result.score >= 0.6)
      .sort((left, right) => right.score - left.score);

    if (fullTextScores[0]) {
      const confidence = Math.min(85, Math.max(70, Math.round(fullTextScores[0].score * 85)));
      return buildResult(fullTextScores[0].entry, "full_text", confidence);
    }

    const fuse = new Fuse(entries, {
      includeScore: true,
      keys: ["question", "aliases", "keywords"],
      threshold: 0.7
    });
    const fuzzyMatch = fuse.search(normalizedQuestion)[0];

    if (fuzzyMatch?.score !== undefined) {
      const confidence = Math.max(60, Math.min(80, Math.round((1 - fuzzyMatch.score) * 80)));

      if (confidence >= 60) {
        return buildResult(fuzzyMatch.item, "fuzzy", confidence);
      }
    }

    return noneResult;
  }
}
