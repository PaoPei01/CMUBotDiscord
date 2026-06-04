import type { SupabaseFetchClient } from "./supabaseClient.js";
import { normalizeSearchText } from "../utils/normalizeText.js";

type SourceRow = {
  id: string;
  last_verified_at: string | null;
  name: string;
  url: string | null;
};

type FAQRow = {
  answer_full: string | null;
  answer_short: string;
  audience: string | null;
  category: string;
  faculty_group: string | null;
  id: string;
  priority: string | null;
  question: string;
  source: SourceRow | null;
  source_page: string | null;
  source_quote: string | null;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
};

type AliasRow = {
  alias: string;
  faq_id: string;
};

type KeywordRow = {
  faq_id: string;
  keyword: string;
};

type FullTextRow = Omit<FAQRow, "source" | "status"> & {
  rank: number;
  source_id: string | null;
  source_last_verified_at: string | null;
  source_name: string | null;
  source_url: string | null;
};

type QuestionLogInsertRow = {
  id: string;
};

export type KnowledgeSearchMethod = "exact" | "alias" | "keyword" | "full_text" | "fuzzy" | "none";

export type KnowledgeSearchResult = {
  answerFull: string | null;
  answerShort: string | null;
  audience: string | null;
  category: string | null;
  confidence: number;
  facultyGroup: string | null;
  faqId: string | null;
  lastVerifiedAt: string | null;
  matchedReason: string | null;
  method: KnowledgeSearchMethod;
  priority: string | null;
  question: string | null;
  sourceName: string | null;
  sourcePage: string | null;
  sourceQuote: string | null;
  sourceUrl: string | null;
  validFrom: string | null;
  validUntil: string | null;
};

const noneResult: KnowledgeSearchResult = {
  answerFull: null,
  answerShort: null,
  audience: null,
  category: null,
  confidence: 0,
  facultyGroup: null,
  faqId: null,
  lastVerifiedAt: null,
  matchedReason: null,
  method: "none",
  priority: null,
  question: null,
  sourceName: null,
  sourcePage: null,
  sourceQuote: null,
  sourceUrl: null,
  validFrom: null,
  validUntil: null
};

function toResult(
  faq: FAQRow,
  method: Exclude<KnowledgeSearchMethod, "none">,
  confidence: number,
  matchedReason: string
): KnowledgeSearchResult {
  return {
    answerFull: faq.answer_full,
    answerShort: faq.answer_short,
    audience: faq.audience,
    category: faq.category,
    confidence,
    facultyGroup: faq.faculty_group,
    faqId: faq.id,
    lastVerifiedAt: faq.source?.last_verified_at ?? null,
    matchedReason,
    method,
    priority: faq.priority,
    question: faq.question,
    sourceName: faq.source?.name ?? null,
    sourcePage: faq.source_page,
    sourceQuote: faq.source_quote,
    sourceUrl: faq.source?.url ?? null,
    validFrom: faq.valid_from,
    validUntil: faq.valid_until
  };
}

function fullTextRowToFaq(row: FullTextRow): FAQRow {
  return {
    answer_full: row.answer_full,
    answer_short: row.answer_short,
    audience: row.audience,
    category: row.category,
    faculty_group: row.faculty_group,
    id: row.id,
    priority: row.priority,
    question: row.question,
    source: row.source_id
      ? {
          id: row.source_id,
          last_verified_at: row.source_last_verified_at,
          name: row.source_name ?? "ไม่ระบุแหล่งข้อมูล",
          url: row.source_url
        }
      : null,
    source_page: row.source_page,
    source_quote: row.source_quote,
    status: "active",
    valid_from: row.valid_from,
    valid_until: row.valid_until
  };
}

function isExpired(validUntil: string | null): boolean {
  return validUntil ? new Date(validUntil).getTime() < Date.now() : false;
}

function searchableText(faq: FAQRow, aliases: AliasRow[], keywords: KeywordRow[]): string {
  return normalizeSearchText(
    [
      faq.category,
      faq.question,
      faq.answer_short,
      faq.answer_full,
      faq.source_quote,
      ...aliases.filter((alias) => alias.faq_id === faq.id).map((alias) => alias.alias),
      ...keywords.filter((keyword) => keyword.faq_id === faq.id).map((keyword) => keyword.keyword)
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function uniqueTokens(value: string): string[] {
  return [...new Set(normalizeSearchText(value).split(" ").filter((token) => token.length >= 2))];
}

function tokenOverlapConfidence(question: string, text: string): number {
  const tokens = uniqueTokens(question);

  if (tokens.length === 0) {
    return 0;
  }

  const matched = tokens.filter((token) => text.includes(token)).length;
  const ratio = matched / tokens.length;

  if (ratio < 0.55) {
    return 0;
  }

  return Math.min(85, Math.max(70, Math.round(70 + ratio * 15)));
}

function levenshteinDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    const current = [leftIndex + 1];

    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex] === right[rightIndex] ? 0 : 1;
      current[rightIndex + 1] = Math.min(
        current[rightIndex]! + 1,
        previous[rightIndex + 1]! + 1,
        previous[rightIndex]! + substitutionCost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? 0;
}

function fuzzyConfidence(question: string, candidates: string[]): { confidence: number; value: string | null } {
  const normalizedQuestion = normalizeSearchText(question);
  let best = { confidence: 0, value: null as string | null };

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeSearchText(candidate);

    if (!normalizedCandidate) {
      continue;
    }

    const maxLength = Math.max(normalizedQuestion.length, normalizedCandidate.length);
    const distance = levenshteinDistance(normalizedQuestion, normalizedCandidate);
    const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength;
    const confidence = Math.round(60 + Math.max(0, similarity - 0.55) * (15 / 0.3));

    if (similarity >= 0.55 && confidence > best.confidence) {
      best = {
        confidence: Math.min(75, Math.max(60, confidence)),
        value: candidate
      };
    }
  }

  return best;
}

export async function searchKnowledge(
  client: SupabaseFetchClient,
  question: string
): Promise<KnowledgeSearchResult> {
  const normalizedQuestion = normalizeSearchText(question);

  if (!normalizedQuestion) {
    return noneResult;
  }

  const faqs = await client.request<FAQRow[]>(
    "faqs?select=*,source:sources(id,name,url,last_verified_at)&status=eq.active"
  );
  const activeFaqs = faqs.filter((faq) => faq.status === "active" && !isExpired(faq.valid_until));
  const exactMatch = activeFaqs.find(
    (faq) => normalizeSearchText(faq.question) === normalizedQuestion
  );

  if (exactMatch) {
    return toResult(exactMatch, "exact", 95, "Exact question match");
  }

  if (activeFaqs.length === 0) {
    return noneResult;
  }

  const faqIds = activeFaqs.map((faq) => faq.id);
  const encodedIds = faqIds.map((id) => `"${id}"`).join(",");
  const [aliases, keywords] = await Promise.all([
    client.request<AliasRow[]>(
      `faq_aliases?select=faq_id,alias&faq_id=in.(${encodedIds})`
    ),
    client.request<KeywordRow[]>(
      `faq_keywords?select=faq_id,keyword&faq_id=in.(${encodedIds})`
    )
  ]);
  const aliasMatch = aliases.find(
    (alias) => normalizeSearchText(alias.alias) === normalizedQuestion
  );

  if (aliasMatch) {
    const faq = activeFaqs.find((candidate) => candidate.id === aliasMatch.faq_id);

    if (faq) {
      return toResult(faq, "alias", 90, `Alias match: ${aliasMatch.alias}`);
    }
  }

  const keywordScores = activeFaqs
    .map((faq) => ({
      faq,
      score: keywords.filter(
        (keyword) =>
          keyword.faq_id === faq.id &&
          normalizedQuestion.includes(normalizeSearchText(keyword.keyword))
      ).length
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (keywordScores[0]) {
    return toResult(keywordScores[0].faq, "keyword", 80, `Keyword matches: ${keywordScores[0].score}`);
  }

  try {
    const [fullTextMatch] = await client.request<FullTextRow[]>("rpc/search_active_faqs_full_text", {
      body: JSON.stringify({
        match_count: 5,
        search_query: question
      }),
      method: "POST"
    });

    if (fullTextMatch) {
      const confidence = Math.min(85, Math.max(70, Math.round(70 + fullTextMatch.rank * 100)));
      return toResult(
        fullTextRowToFaq(fullTextMatch),
        "full_text",
        confidence,
        `PostgreSQL full-text rank: ${fullTextMatch.rank.toFixed(4)}`
      );
    }
  } catch {
    const fullTextScores = activeFaqs
      .map((faq) => ({
        confidence: tokenOverlapConfidence(
          question,
          searchableText(faq, aliases, keywords)
        ),
        faq
      }))
      .filter((entry) => entry.confidence > 0)
      .sort((left, right) => right.confidence - left.confidence);

    if (fullTextScores[0]) {
      return toResult(
        fullTextScores[0].faq,
        "full_text",
        fullTextScores[0].confidence,
        "Deterministic token overlap fallback"
      );
    }
  }

  const fuzzyScores = activeFaqs
    .map((faq) => {
      const candidates = [
        faq.question,
        ...aliases.filter((alias) => alias.faq_id === faq.id).map((alias) => alias.alias),
        ...keywords.filter((keyword) => keyword.faq_id === faq.id).map((keyword) => keyword.keyword)
      ];
      return {
        faq,
        ...fuzzyConfidence(question, candidates)
      };
    })
    .filter((entry) => entry.confidence >= 60)
    .sort((left, right) => right.confidence - left.confidence);

  if (fuzzyScores[0]) {
    return toResult(
      fuzzyScores[0].faq,
      "fuzzy",
      fuzzyScores[0].confidence,
      fuzzyScores[0].value ? `Fuzzy match: ${fuzzyScores[0].value}` : "Fuzzy match"
    );
  }

  return noneResult;
}

export async function logQuestion(
  client: SupabaseFetchClient,
  input: {
    confidence: number;
    discordGuildId: string | null;
    discordUserId: string | null;
    matchedFaqId: string | null;
    method: string;
    responseTimeMs: number;
    userQuestion: string;
  }
): Promise<string | null> {
  try {
    const [row] = await client.request<QuestionLogInsertRow[]>("question_logs?select=id", {
      body: JSON.stringify({
        confidence: input.confidence,
        discord_guild_id: input.discordGuildId,
        discord_user_id: input.discordUserId,
        matched_faq_id: input.matchedFaqId,
        method: input.method,
        response_time_ms: input.responseTimeMs,
        user_question: input.userQuestion
      }),
      headers: {
        Prefer: "return=representation"
      },
      method: "POST"
    });

    return row?.id ?? null;
  } catch {
    // Question logging must not block the Discord response.
    return null;
  }
}

export async function saveFeedback(
  client: SupabaseFetchClient,
  input: {
    discordUserId: string | null;
    questionLogId: string;
    vote: "up" | "down";
  }
): Promise<void> {
  await client.request("feedback", {
    body: JSON.stringify({
      discord_user_id: input.discordUserId,
      question_log_id: input.questionLogId,
      vote: input.vote
    }),
    method: "POST"
  });
}
