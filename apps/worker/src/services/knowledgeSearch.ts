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

type QuestionLogInsertRow = {
  id: string;
};

export type KnowledgeSearchMethod = "exact" | "alias" | "keyword" | "none";

export type KnowledgeSearchResult = {
  answerFull: string | null;
  answerShort: string | null;
  audience: string | null;
  category: string | null;
  confidence: number;
  facultyGroup: string | null;
  faqId: string | null;
  lastVerifiedAt: string | null;
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
  confidence: number
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
  const activeFaqs = faqs.filter((faq) => faq.status === "active");
  const exactMatch = activeFaqs.find(
    (faq) => normalizeSearchText(faq.question) === normalizedQuestion
  );

  if (exactMatch) {
    return toResult(exactMatch, "exact", 95);
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
      return toResult(faq, "alias", 90);
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
    return toResult(keywordScores[0].faq, "keyword", 80);
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
