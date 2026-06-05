import { createClient } from "@supabase/supabase-js";

import { randomUUID } from "node:crypto";

import type { FAQPriority, FAQStatus, FeedbackVote } from "./types.js";

type SourceRow = {
  id: string;
  name: string;
  url: string | null;
  source_type: string;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type FAQRow = {
  answer?: string;
  answer_full: string | null;
  answer_short: string;
  audience: string | null;
  id: string;
  category: string;
  faq_code: string;
  faculty_group: string | null;
  question: string;
  priority: FAQPriority;
  source_page: string | null;
  source_quote: string | null;
  source_id: string | null;
  status: FAQStatus;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
};

type FAQAliasRow = {
  id: string;
  faq_id: string;
  alias: string;
  created_at: string;
};

type FAQKeywordRow = {
  id: string;
  faq_id: string;
  keyword: string;
  created_at: string;
};

type QuestionLogRow = {
  id: string;
  user_question: string;
  matched_faq_id: string | null;
  confidence: number | null;
  method: string | null;
  response_time_ms: number | null;
  discord_user_id: string | null;
  discord_guild_id: string | null;
  trigger_type: string | null;
  intent: string | null;
  reviewed_at: string | null;
  review_action: string | null;
  review_notes: string | null;
  review_linked_faq_id: string | null;
  created_at: string;
};

type FeedbackRow = {
  id: string;
  question_log_id: string;
  vote: FeedbackVote;
  comment: string | null;
  discord_user_id: string | null;
  created_at: string;
};

type KnowledgeSourceRow = {
  id: string;
  name: string;
  source_type: "pdf" | "docx" | "txt" | "markdown" | "url";
  url: string | null;
  file_name: string | null;
  mime_type: string | null;
  content_hash: string | null;
  status: "processing" | "processed" | "failed" | "archived";
  created_at: string;
  updated_at: string;
};

type IngestionJobRow = {
  id: string;
  knowledge_source_id: string;
  status: "queued" | "running" | "completed" | "failed";
  parser: string;
  chunk_size_words: number;
  overlap_words: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type DraftFAQStatus = "pending" | "approved" | "rejected" | "duplicate";

type DraftFAQRow = {
  id: string;
  ingestion_job_id: string;
  knowledge_source_id: string;
  question: string;
  answer: string;
  category: string;
  confidence: number;
  status: DraftFAQStatus;
  duplicate_of_faq_id: string | null;
  duplicate_of_draft_id: string | null;
  duplicate_confidence: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type DraftKeywordRow = {
  id: string;
  draft_faq_id: string;
  keyword: string;
  created_at: string;
};

type KnowledgeReviewRow = {
  id: string;
  draft_faq_id: string | null;
  action: "approve" | "reject" | "edit" | "bulk_approve" | "bulk_reject";
  reviewer: string | null;
  notes: string | null;
  production_faq_id: string | null;
  created_at: string;
};

type KnowledgeImportLogRow = {
  id: string;
  ingestion_job_id: string | null;
  draft_faq_id: string | null;
  action: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type SupabaseAdminSchema = {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: Omit<SourceRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<SourceRow>;
      };
      faqs: {
        Row: FAQRow;
        Insert: Omit<FAQRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<FAQRow>;
      };
      faq_aliases: {
        Row: FAQAliasRow;
        Insert: Omit<FAQAliasRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<FAQAliasRow>;
      };
      faq_keywords: {
        Row: FAQKeywordRow;
        Insert: Omit<FAQKeywordRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<FAQKeywordRow>;
      };
      question_logs: {
        Row: QuestionLogRow;
        Insert: Omit<QuestionLogRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<QuestionLogRow>;
      };
      feedback: {
        Row: FeedbackRow;
        Insert: Omit<FeedbackRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<FeedbackRow>;
      };
      knowledge_sources: {
        Row: KnowledgeSourceRow;
        Insert: Omit<KnowledgeSourceRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<KnowledgeSourceRow>;
      };
      ingestion_jobs: {
        Row: IngestionJobRow;
        Insert: Omit<IngestionJobRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<IngestionJobRow>;
      };
      draft_faqs: {
        Row: DraftFAQRow;
        Insert: Omit<DraftFAQRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<DraftFAQRow>;
      };
      draft_keywords: {
        Row: DraftKeywordRow;
        Insert: Omit<DraftKeywordRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<DraftKeywordRow>;
      };
      knowledge_reviews: {
        Row: KnowledgeReviewRow;
        Insert: Omit<KnowledgeReviewRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<KnowledgeReviewRow>;
      };
      knowledge_import_logs: {
        Row: KnowledgeImportLogRow;
        Insert: Omit<KnowledgeImportLogRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<KnowledgeImportLogRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type AdminFAQ = FAQRow & {
  aliases: FAQAliasRow[];
  keywords: FAQKeywordRow[];
  source: SourceRow | null;
};

export type AdminFAQInput = {
  aliases: string[];
  answer: string;
  category: string;
  keywords: string[];
  lastVerifiedAt: string | null;
  question: string;
  sourceName: string;
  sourceUrl: string | null;
  status: FAQStatus;
};

export type AdminQuestionLog = QuestionLogRow & {
  matched_faq: Pick<FAQRow, "id" | "question"> | null;
};

export type AdminFreshnessItem = AdminFAQ & {
  freshness_reasons: Array<"expired" | "expiring_soon" | "stale_source">;
};

export type AdminQuestionReviewItem = {
  confidence: number | null;
  created_at: string;
  discord_guild_id: string | null;
  feedback_vote: FeedbackVote | null;
  id: string;
  matched_faq: Pick<FAQRow, "id" | "question"> | null;
  method: string | null;
  reason: "unanswered" | "low_confidence" | "negative_feedback";
  suggested_action: "add_faq" | "add_alias" | "add_keyword" | "review_faq";
  question_log_id: string;
  user_question: string;
};

export type AdminQaInsights = {
  averageResponseTimeMs: number | null;
  answeredQuestions: number;
  feedbackDownCount: number;
  feedbackUpCount: number;
  lowConfidenceQuestions: number;
  mostDownVotedFaqs: Array<{
    downVotes: number;
    faqId: string;
    question: string;
  }>;
  notFoundQuestions: number;
  since: string;
  topMatchedFaqs: Array<{
    count: number;
    faqId: string;
    question: string;
  }>;
  topUnansweredQuestions: Array<{
    count: number;
    question: string;
  }>;
  totalQuestions: number;
};

export type AdminDraftFAQ = DraftFAQRow & {
  keywords: DraftKeywordRow[];
  knowledge_source: KnowledgeSourceRow;
};

export type AdminDraftFAQInput = {
  answer: string;
  category: string;
  confidence: number;
  duplicateConfidence: number;
  duplicateOfDraftId: string | null;
  duplicateOfFaqId: string | null;
  keywords: string[];
  question: string;
  status: DraftFAQStatus;
};

export type AdminIngestionInput = {
  chunkSizeWords: number;
  contentHash?: string | null;
  drafts: AdminDraftFAQInput[];
  fileName?: string | null;
  mimeType?: string | null;
  name: string;
  overlapWords: number;
  parser: string;
  sourceType: KnowledgeSourceRow["source_type"];
  url?: string | null;
};

export type AdminKnowledgeReview = KnowledgeReviewRow & {
  draft_faq: Pick<DraftFAQRow, "id" | "question" | "status"> | null;
};

export type AdminImportLog = KnowledgeImportLogRow;

export type AdminDatabase = {
  addQuestionAliasToFaq(input: {
    alias: string;
    faqId: string;
    questionLogId: string;
  }): Promise<void>;
  addQuestionKeywordToFaq(input: {
    faqId: string;
    keyword: string;
    questionLogId: string;
  }): Promise<void>;
  approveDraft(id: string, reviewer?: string | null): Promise<string>;
  bulkApproveDrafts(ids: string[], reviewer?: string | null): Promise<string[]>;
  bulkRejectDrafts(ids: string[], reviewer?: string | null): Promise<void>;
  createDraftFromQuestion(questionLogId: string): Promise<string>;
  createFaq(input: AdminFAQInput): Promise<string>;
  createIngestionWithDrafts(input: AdminIngestionInput): Promise<string>;
  editDraft(
    id: string,
    input: Pick<AdminDraftFAQInput, "answer" | "category" | "confidence" | "keywords" | "question">
  ): Promise<void>;
  getFaq(id: string): Promise<AdminFAQ | null>;
  getQaInsights(): Promise<AdminQaInsights>;
  getDraft(id: string): Promise<AdminDraftFAQ | null>;
  listCategories(): Promise<string[]>;
  listDraftDuplicateChecks(): Promise<Array<{ id: string; keywords: string[]; question: string }>>;
  listDrafts(status?: DraftFAQStatus): Promise<AdminDraftFAQ[]>;
  listFaqs(filters: {
    category?: string;
    query?: string;
    status?: FAQStatus;
  }): Promise<AdminFAQ[]>;
  listImportLogs(): Promise<AdminImportLog[]>;
  listMissingQuestions(): Promise<AdminQuestionLog[]>;
  listFreshnessItems(): Promise<AdminFreshnessItem[]>;
  listQuestionLogs(): Promise<AdminQuestionLog[]>;
  listQuestionReviewItems(): Promise<AdminQuestionReviewItem[]>;
  listReviews(): Promise<AdminKnowledgeReview[]>;
  linkQuestionToFaq(input: { faqId: string; questionLogId: string }): Promise<void>;
  markQuestionReviewed(questionLogId: string, action?: string): Promise<void>;
  markSourceReviewed(sourceId: string): Promise<void>;
  rejectDraft(id: string, reviewer?: string | null): Promise<void>;
  updateFaq(id: string, input: AdminFAQInput): Promise<void>;
};

type AdminOptions = {
  serviceRoleKey: string;
  supabaseUrl: string;
};

function compactValues(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function normalizeReviewTerm(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

function duplicateKey(value: string): string {
  return normalizeReviewTerm(value).toLocaleLowerCase("th-TH");
}

function validateReviewTerm(value: string, label: "Alias" | "Keyword"): string {
  const normalized = normalizeReviewTerm(value);

  if (normalized.length === 0) {
    throw new Error(`${label} is required`);
  }

  if (normalized.length < 2) {
    throw new Error(`${label} must be at least 2 characters`);
  }

  if (normalized.length > 200) {
    throw new Error(`${label} must be 200 characters or fewer`);
  }

  return normalized;
}

function normalizeInsightQuestion(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toLocaleLowerCase("th-TH");
}

function isAnsweredQuestion(log: QuestionLogRow): boolean {
  return Boolean(log.matched_faq_id) && (log.confidence ?? 0) >= 70;
}

function isNotFoundQuestion(log: QuestionLogRow): boolean {
  return !log.matched_faq_id || log.confidence === null || log.confidence < 70;
}

function isLowConfidenceQuestion(log: QuestionLogRow): boolean {
  return Boolean(log.matched_faq_id) && (log.confidence ?? 0) >= 70 && (log.confidence ?? 0) < 90;
}

function createFaqCode(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) {
    throw new Error(error.message);
  }

  if (data === null) {
    throw new Error("Database operation returned no data");
  }

  return data;
}

export function createSupabaseAdminDatabase(options: AdminOptions): AdminDatabase {
  const client = createClient<SupabaseAdminSchema>(
    options.supabaseUrl,
    options.serviceRoleKey,
    {
      auth: {
        persistSession: false
      }
    }
  );

  async function findOrCreateSourceByValues({
    lastVerifiedAt,
    sourceName,
    sourceUrl
  }: {
    lastVerifiedAt: string | null;
    sourceName: string;
    sourceUrl: string | null;
  }): Promise<string> {
    const cleanSourceName = sourceName.trim();
    const cleanSourceUrl = sourceUrl?.trim() || null;

    const existing = await client
      .from("sources")
      .select("*")
      .eq("name", cleanSourceName)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      const updated = await client
        .from("sources")
        .update({
          last_verified_at: lastVerifiedAt,
          url: cleanSourceUrl
        })
        .eq("id", existing.data.id)
        .select()
        .single();

      return requireData(updated.data, updated.error).id;
    }

    const created = await client
      .from("sources")
      .insert({
        last_verified_at: lastVerifiedAt,
        name: cleanSourceName,
        source_type: "website",
        url: cleanSourceUrl
      })
      .select()
      .single();

    return requireData(created.data, created.error).id;
  }

  async function findOrCreateSource(input: AdminFAQInput): Promise<string> {
    return findOrCreateSourceByValues({
      lastVerifiedAt: input.lastVerifiedAt,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl
    });
  }

  async function replaceAliasesAndKeywords(
    faqId: string,
    aliases: string[],
    keywords: string[]
  ): Promise<void> {
    const aliasDelete = await client.from("faq_aliases").delete().eq("faq_id", faqId);
    if (aliasDelete.error) {
      throw new Error(aliasDelete.error.message);
    }

    const keywordDelete = await client
      .from("faq_keywords")
      .delete()
      .eq("faq_id", faqId);
    if (keywordDelete.error) {
      throw new Error(keywordDelete.error.message);
    }

    const cleanAliases = compactValues(aliases);
    if (cleanAliases.length > 0) {
      const insertedAliases = await client.from("faq_aliases").insert(
        cleanAliases.map((alias) => ({
          alias,
          faq_id: faqId
        }))
      );

      if (insertedAliases.error) {
        throw new Error(insertedAliases.error.message);
      }
    }

    const cleanKeywords = compactValues(keywords);
    if (cleanKeywords.length > 0) {
      const insertedKeywords = await client.from("faq_keywords").insert(
        cleanKeywords.map((keyword) => ({
          faq_id: faqId,
          keyword
        }))
      );

      if (insertedKeywords.error) {
        throw new Error(insertedKeywords.error.message);
      }
    }
  }

  async function fetchFaqQuestionMap(faqIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(faqIds)].filter(Boolean);

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const result = await client
      .from("faqs")
      .select("id, question")
      .in("id", uniqueIds);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return new Map((result.data ?? []).map((faq) => [faq.id, faq.question]));
  }

  function topUnansweredQuestionCounts(
    logs: QuestionLogRow[]
  ): AdminQaInsights["topUnansweredQuestions"] {
    const counts = new Map<string, { count: number; question: string }>();

    for (const log of logs.filter(isNotFoundQuestion)) {
      const question = log.user_question.trim().replace(/\s+/gu, " ");
      const key = normalizeInsightQuestion(question);

      if (!key) {
        continue;
      }

      const existing = counts.get(key);
      counts.set(key, {
        count: (existing?.count ?? 0) + 1,
        question: existing?.question ?? question
      });
    }

    return [...counts.values()]
      .sort((left, right) => right.count - left.count || left.question.localeCompare(right.question))
      .slice(0, 10);
  }

  async function topMatchedFaqCounts(
    logs: QuestionLogRow[]
  ): Promise<AdminQaInsights["topMatchedFaqs"]> {
    const counts = new Map<string, number>();

    for (const log of logs.filter(isAnsweredQuestion)) {
      if (log.matched_faq_id) {
        counts.set(log.matched_faq_id, (counts.get(log.matched_faq_id) ?? 0) + 1);
      }
    }

    const questions = await fetchFaqQuestionMap([...counts.keys()]);

    return [...counts.entries()]
      .map(([faqId, count]) => ({
        count,
        faqId,
        question: questions.get(faqId) ?? "Unknown FAQ"
      }))
      .sort((left, right) => right.count - left.count || left.question.localeCompare(right.question))
      .slice(0, 10);
  }

  async function getFaq(id: string): Promise<AdminFAQ | null> {
    const faqResult = await client.from("faqs").select("*").eq("id", id).maybeSingle();

    if (faqResult.error) {
      throw new Error(faqResult.error.message);
    }

    if (!faqResult.data) {
      return null;
    }

    const [sourceResult, aliasResult, keywordResult] = await Promise.all([
      faqResult.data.source_id
        ? client
            .from("sources")
            .select("*")
            .eq("id", faqResult.data.source_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      client.from("faq_aliases").select("*").eq("faq_id", id).order("alias"),
      client.from("faq_keywords").select("*").eq("faq_id", id).order("keyword")
    ]);

    if (sourceResult.error) {
      throw new Error(sourceResult.error.message);
    }
    if (aliasResult.error) {
      throw new Error(aliasResult.error.message);
    }
    if (keywordResult.error) {
      throw new Error(keywordResult.error.message);
    }

    return {
      ...faqResult.data,
      aliases: aliasResult.data ?? [],
      keywords: keywordResult.data ?? [],
      source: sourceResult.data
    };
  }

  async function listFaqs(filters: {
    category?: string;
    query?: string;
    status?: FAQStatus;
  }): Promise<AdminFAQ[]> {
    let query = client.from("faqs").select("*").order("updated_at", {
      ascending: false
    });

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.query) {
      query = query.or(
        `question.ilike.%${filters.query}%,answer.ilike.%${filters.query}%,answer_short.ilike.%${filters.query}%`
      );
    }

    const result = await query;

    if (result.error) {
      throw new Error(result.error.message);
    }

    const faqs = await Promise.all((result.data ?? []).map((faq) => getFaq(faq.id)));
    return faqs.filter((faq): faq is AdminFAQ => faq !== null);
  }

  async function listFreshnessItems(): Promise<AdminFreshnessItem[]> {
    const faqs = await listFaqs({});
    const now = Date.now();
    const next30Days = now + 30 * 24 * 60 * 60 * 1000;
    const staleThreshold = now - 90 * 24 * 60 * 60 * 1000;

    return faqs
      .map((faq) => {
        const validUntil = faq.valid_until ? new Date(faq.valid_until).getTime() : null;
        const lastVerifiedAt = faq.source?.last_verified_at
          ? new Date(faq.source.last_verified_at).getTime()
          : null;
        const freshness_reasons: AdminFreshnessItem["freshness_reasons"] = [];

        if (validUntil !== null && validUntil < now) {
          freshness_reasons.push("expired");
        } else if (validUntil !== null && validUntil <= next30Days) {
          freshness_reasons.push("expiring_soon");
        }

        if (lastVerifiedAt === null || lastVerifiedAt < staleThreshold) {
          freshness_reasons.push("stale_source");
        }

        return {
          ...faq,
          freshness_reasons
        };
      })
      .filter((faq) => faq.freshness_reasons.length > 0)
      .sort((left, right) => {
        const leftDate = left.valid_until ?? left.source?.last_verified_at ?? left.updated_at;
        const rightDate = right.valid_until ?? right.source?.last_verified_at ?? right.updated_at;
        return new Date(leftDate).getTime() - new Date(rightDate).getTime();
      });
  }

  async function mostDownVotedFaqCounts(
    feedback: FeedbackRow[]
  ): Promise<AdminQaInsights["mostDownVotedFaqs"]> {
    const downVoteLogIds = [
      ...new Set(
        feedback
          .filter((row) => row.vote === "down")
          .map((row) => row.question_log_id)
          .filter(Boolean)
      )
    ];

    if (downVoteLogIds.length === 0) {
      return [];
    }

    const logsResult = await client
      .from("question_logs")
      .select("*")
      .in("id", downVoteLogIds);

    if (logsResult.error) {
      throw new Error(logsResult.error.message);
    }

    const logById = new Map((logsResult.data ?? []).map((log) => [log.id, log]));
    const counts = new Map<string, number>();

    for (const row of feedback.filter((item) => item.vote === "down")) {
      const log = logById.get(row.question_log_id);

      if (log?.matched_faq_id) {
        counts.set(log.matched_faq_id, (counts.get(log.matched_faq_id) ?? 0) + 1);
      }
    }

    const questions = await fetchFaqQuestionMap([...counts.keys()]);

    return [...counts.entries()]
      .map(([faqId, downVotes]) => ({
        downVotes,
        faqId,
        question: questions.get(faqId) ?? "Unknown FAQ"
      }))
      .sort(
        (left, right) =>
          right.downVotes - left.downVotes || left.question.localeCompare(right.question)
      )
      .slice(0, 10);
  }

  async function getQaInsights(): Promise<AdminQaInsights> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [logsResult, feedbackResult] = await Promise.all([
      client
        .from("question_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      client
        .from("feedback")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
    ]);

    if (logsResult.error) {
      throw new Error(logsResult.error.message);
    }

    if (feedbackResult.error) {
      throw new Error(feedbackResult.error.message);
    }

    const logs = logsResult.data ?? [];
    const feedback = feedbackResult.data ?? [];
    const responseTimes = logs
      .map((log) => log.response_time_ms)
      .filter((value): value is number => typeof value === "number");
    const averageResponseTimeMs =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((total, value) => total + value, 0) / responseTimes.length)
        : null;

    return {
      averageResponseTimeMs,
      answeredQuestions: logs.filter(isAnsweredQuestion).length,
      feedbackDownCount: feedback.filter((row) => row.vote === "down").length,
      feedbackUpCount: feedback.filter((row) => row.vote === "up").length,
      lowConfidenceQuestions: logs.filter(isLowConfidenceQuestion).length,
      mostDownVotedFaqs: await mostDownVotedFaqCounts(feedback),
      notFoundQuestions: logs.filter(isNotFoundQuestion).length,
      since,
      topMatchedFaqs: await topMatchedFaqCounts(logs),
      topUnansweredQuestions: topUnansweredQuestionCounts(logs),
      totalQuestions: logs.length
    };
  }

  async function questionLogWithFaq(log: QuestionLogRow): Promise<AdminQuestionLog> {
    if (!log.matched_faq_id) {
      return { ...log, matched_faq: null };
    }

    const faq = await client
      .from("faqs")
      .select("id, question")
      .eq("id", log.matched_faq_id)
      .maybeSingle();

    if (faq.error) {
      throw new Error(faq.error.message);
    }

    return { ...log, matched_faq: faq.data };
  }

  async function listQuestionLogs(): Promise<AdminQuestionLog[]> {
    const result = await client
      .from("question_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return Promise.all((result.data ?? []).map(questionLogWithFaq));
  }

  function suggestedReviewAction(
    reason: AdminQuestionReviewItem["reason"],
    log: AdminQuestionLog
  ): AdminQuestionReviewItem["suggested_action"] {
    if (reason === "unanswered") {
      return "add_faq";
    }

    if (reason === "negative_feedback") {
      return "review_faq";
    }

    return log.method === "fuzzy" || log.method === "full_text" ? "add_alias" : "add_keyword";
  }

  async function listQuestionReviewItems(): Promise<AdminQuestionReviewItem[]> {
    const [unansweredResult, lowConfidenceResult, negativeFeedbackResult] = await Promise.all([
      client
        .from("question_logs")
        .select("*")
        .is("reviewed_at", null)
        .or("matched_faq_id.is.null,confidence.is.null,confidence.lt.70")
        .order("created_at", { ascending: false })
        .limit(50),
      client
        .from("question_logs")
        .select("*")
        .is("reviewed_at", null)
        .not("matched_faq_id", "is", null)
        .gte("confidence", 70)
        .lt("confidence", 90)
        .order("created_at", { ascending: false })
        .limit(50),
      client
        .from("feedback")
        .select("*")
        .eq("vote", "down")
        .order("created_at", { ascending: false })
        .limit(50)
    ]);

    if (unansweredResult.error) {
      throw new Error(unansweredResult.error.message);
    }
    if (lowConfidenceResult.error) {
      throw new Error(lowConfidenceResult.error.message);
    }
    if (negativeFeedbackResult.error) {
      throw new Error(negativeFeedbackResult.error.message);
    }

    const negativeLogIds = [
      ...new Set((negativeFeedbackResult.data ?? []).map((feedback) => feedback.question_log_id))
    ];
    const negativeLogs =
      negativeLogIds.length > 0
        ? await client
            .from("question_logs")
            .select("*")
            .is("reviewed_at", null)
            .in("id", negativeLogIds)
        : { data: [] as QuestionLogRow[], error: null };

    if (negativeLogs.error) {
      throw new Error(negativeLogs.error.message);
    }

    const feedbackByLogId = new Map(
      (negativeFeedbackResult.data ?? []).map((feedback) => [feedback.question_log_id, feedback])
    );
    const rows = [
      ...(await Promise.all((unansweredResult.data ?? []).map(questionLogWithFaq))).map((log) => ({
        log,
        reason: "unanswered" as const,
        vote: null
      })),
      ...(await Promise.all((lowConfidenceResult.data ?? []).map(questionLogWithFaq))).map(
        (log) => ({
          log,
          reason: "low_confidence" as const,
          vote: null
        })
      ),
      ...(await Promise.all((negativeLogs.data ?? []).map(questionLogWithFaq))).map((log) => ({
        log,
        reason: "negative_feedback" as const,
        vote: feedbackByLogId.get(log.id)?.vote ?? null
      }))
    ];
    const uniqueRows = new Map<string, (typeof rows)[number]>();

    for (const row of rows) {
      uniqueRows.set(`${row.reason}:${row.log.id}`, row);
    }

    return [...uniqueRows.values()]
      .sort(
        (left, right) =>
          new Date(right.log.created_at).getTime() - new Date(left.log.created_at).getTime()
      )
      .map(({ log, reason, vote }) => ({
        confidence: log.confidence,
        created_at: log.created_at,
        discord_guild_id: log.discord_guild_id,
        feedback_vote: vote,
        id: `${reason}:${log.id}`,
        matched_faq: log.matched_faq,
        method: log.method,
        question_log_id: log.id,
        reason,
        suggested_action: suggestedReviewAction(reason, log),
        user_question: log.user_question
      }));
  }

  async function getQuestionLog(id: string): Promise<QuestionLogRow> {
    const result = await client.from("question_logs").select("*").eq("id", id).single();
    return requireData(result.data, result.error);
  }

  async function markQuestionReviewed(questionLogId: string, action = "reviewed"): Promise<void> {
    const updated = await client
      .from("question_logs")
      .update({
        review_action: action,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", questionLogId);

    if (updated.error) {
      throw new Error(updated.error.message);
    }
  }

  async function createDraftFromQuestion(questionLogId: string): Promise<string> {
    const log = await getQuestionLog(questionLogId);
    const sourceResult = await client
      .from("knowledge_sources")
      .insert({
        content_hash: null,
        file_name: null,
        mime_type: null,
        name: "Admin review queue",
        source_type: "txt",
        status: "processed",
        url: null
      })
      .select()
      .single();
    const source = requireData(sourceResult.data, sourceResult.error);
    const jobResult = await client
      .from("ingestion_jobs")
      .insert({
        chunk_size_words: 0,
        completed_at: new Date().toISOString(),
        error_message: null,
        knowledge_source_id: source.id,
        overlap_words: 0,
        parser: "admin-review",
        status: "completed"
      })
      .select()
      .single();
    const job = requireData(jobResult.data, jobResult.error);
    const draftResult = await client
      .from("draft_faqs")
      .insert({
        answer: "TODO: เติมคำตอบจากแหล่งข้อมูลที่ตรวจสอบแล้ว",
        category: "Review",
        confidence: 0,
        duplicate_confidence: null,
        duplicate_of_draft_id: null,
        duplicate_of_faq_id: null,
        ingestion_job_id: job.id,
        knowledge_source_id: source.id,
        question: log.user_question.trim(),
        reviewed_at: null,
        status: "pending"
      })
      .select()
      .single();
    const draft = requireData(draftResult.data, draftResult.error);

    await logImport({
      action: "draft_created_from_review",
      draftFaqId: draft.id,
      ingestionJobId: job.id,
      message: "Draft FAQ created from admin review queue",
      metadata: { questionLogId }
    });
    await markQuestionReviewed(questionLogId, "created_draft");
    return draft.id;
  }

  async function linkQuestionToFaq(input: { faqId: string; questionLogId: string }): Promise<void> {
    const updated = await client
      .from("question_logs")
      .update({
        matched_faq_id: input.faqId,
        review_action: "linked_faq",
        review_linked_faq_id: input.faqId,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", input.questionLogId);

    if (updated.error) {
      throw new Error(updated.error.message);
    }
  }

  async function addQuestionAliasToFaq(input: {
    alias: string;
    faqId: string;
    questionLogId: string;
  }): Promise<void> {
    const alias = validateReviewTerm(input.alias, "Alias");
    const existing = await client.from("faq_aliases").select("alias").eq("faq_id", input.faqId);

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    const hasDuplicate = (existing.data ?? []).some(
      (row) => duplicateKey(row.alias) === duplicateKey(alias)
    );

    if (!hasDuplicate) {
      const inserted = await client.from("faq_aliases").insert({
        alias,
        faq_id: input.faqId
      });

      if (inserted.error) {
        throw new Error(inserted.error.message);
      }
    }

    await linkQuestionToFaq(input);
  }

  async function addQuestionKeywordToFaq(input: {
    faqId: string;
    keyword: string;
    questionLogId: string;
  }): Promise<void> {
    const keyword = validateReviewTerm(input.keyword, "Keyword");
    const existing = await client.from("faq_keywords").select("keyword").eq("faq_id", input.faqId);

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    const hasDuplicate = (existing.data ?? []).some(
      (row) => duplicateKey(row.keyword) === duplicateKey(keyword)
    );

    if (!hasDuplicate) {
      const inserted = await client.from("faq_keywords").insert({
        faq_id: input.faqId,
        keyword
      });

      if (inserted.error) {
        throw new Error(inserted.error.message);
      }
    }

    await linkQuestionToFaq(input);
  }

  async function getDraft(id: string): Promise<AdminDraftFAQ | null> {
    const draftResult = await client
      .from("draft_faqs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (draftResult.error) {
      throw new Error(draftResult.error.message);
    }

    if (!draftResult.data) {
      return null;
    }

    const [sourceResult, keywordResult] = await Promise.all([
      client
        .from("knowledge_sources")
        .select("*")
        .eq("id", draftResult.data.knowledge_source_id)
        .single(),
      client
        .from("draft_keywords")
        .select("*")
        .eq("draft_faq_id", id)
        .order("keyword")
    ]);

    if (sourceResult.error) {
      throw new Error(sourceResult.error.message);
    }
    if (keywordResult.error) {
      throw new Error(keywordResult.error.message);
    }

    return {
      ...draftResult.data,
      keywords: keywordResult.data ?? [],
      knowledge_source: sourceResult.data
    };
  }

  async function replaceDraftKeywords(draftId: string, keywords: string[]): Promise<void> {
    const deleted = await client
      .from("draft_keywords")
      .delete()
      .eq("draft_faq_id", draftId);

    if (deleted.error) {
      throw new Error(deleted.error.message);
    }

    const cleanKeywords = compactValues(keywords);

    if (cleanKeywords.length === 0) {
      return;
    }

    const inserted = await client.from("draft_keywords").insert(
      cleanKeywords.map((keyword) => ({
        draft_faq_id: draftId,
        keyword
      }))
    );

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }
  }

  async function logImport(input: {
    action: string;
    draftFaqId?: string | null;
    ingestionJobId?: string | null;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const logged = await client.from("knowledge_import_logs").insert({
      action: input.action,
      draft_faq_id: input.draftFaqId ?? null,
      ingestion_job_id: input.ingestionJobId ?? null,
      message: input.message,
      metadata: input.metadata ?? {}
    });

    if (logged.error) {
      throw new Error(logged.error.message);
    }
  }

  async function reviewDraft(input: {
    action: KnowledgeReviewRow["action"];
    draftId: string;
    notes?: string | null;
    productionFaqId?: string | null;
    reviewer?: string | null;
  }): Promise<void> {
    const reviewed = await client.from("knowledge_reviews").insert({
      action: input.action,
      draft_faq_id: input.draftId,
      notes: input.notes ?? null,
      production_faq_id: input.productionFaqId ?? null,
      reviewer: input.reviewer ?? null
    });

    if (reviewed.error) {
      throw new Error(reviewed.error.message);
    }
  }

  async function approveDraft(id: string, reviewer?: string | null): Promise<string> {
    const draft = await getDraft(id);

    if (!draft) {
      throw new Error("Draft FAQ not found");
    }

    if (draft.status === "duplicate") {
      throw new Error("Duplicate drafts cannot be approved into production");
    }

    if (draft.status === "approved") {
      throw new Error("Draft FAQ is already approved");
    }

    const sourceId = await findOrCreateSourceByValues({
      lastVerifiedAt: new Date().toISOString(),
      sourceName: draft.knowledge_source.name,
      sourceUrl: draft.knowledge_source.url
    });
    const createdFaq = await client
      .from("faqs")
      .insert({
        answer: draft.answer.trim(),
        answer_full: draft.answer.trim(),
        answer_short: draft.answer.trim(),
        audience: null,
        category: draft.category.trim(),
        faq_code: createFaqCode("draft"),
        faculty_group: null,
        priority: "medium",
        question: draft.question.trim(),
        source_page: null,
        source_quote: null,
        source_id: sourceId,
        status: "active",
        valid_from: null,
        valid_until: null
      })
      .select()
      .single();
    const faq = requireData(createdFaq.data, createdFaq.error);
    const keywords = compactValues(draft.keywords.map((keyword) => keyword.keyword));

    if (keywords.length > 0) {
      const insertedKeywords = await client.from("faq_keywords").insert(
        keywords.map((keyword) => ({
          faq_id: faq.id,
          keyword
        }))
      );

      if (insertedKeywords.error) {
        throw new Error(insertedKeywords.error.message);
      }
    }

    const updatedDraft = await client
      .from("draft_faqs")
      .update({
        reviewed_at: new Date().toISOString(),
        status: "approved"
      })
      .eq("id", id);

    if (updatedDraft.error) {
      throw new Error(updatedDraft.error.message);
    }

    await reviewDraft({
      action: "approve",
      draftId: id,
      productionFaqId: faq.id,
      reviewer
    });
    await logImport({
      action: "approve",
      draftFaqId: id,
      ingestionJobId: draft.ingestion_job_id,
      message: "Approved draft FAQ into production FAQ",
      metadata: { productionFaqId: faq.id }
    });

    return faq.id;
  }

  async function rejectDraft(id: string, reviewer?: string | null): Promise<void> {
    const draft = await getDraft(id);

    if (!draft) {
      throw new Error("Draft FAQ not found");
    }

    const updated = await client
      .from("draft_faqs")
      .update({
        reviewed_at: new Date().toISOString(),
        status: "rejected"
      })
      .eq("id", id);

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    await reviewDraft({
      action: "reject",
      draftId: id,
      reviewer
    });
    await logImport({
      action: "reject",
      draftFaqId: id,
      ingestionJobId: draft.ingestion_job_id,
      message: "Rejected draft FAQ and kept it archived"
    });
  }

  async function listDrafts(status?: DraftFAQStatus): Promise<AdminDraftFAQ[]> {
    let query = client.from("draft_faqs").select("*").order("created_at", {
      ascending: false
    });

    if (status) {
      query = query.eq("status", status);
    }

    const result = await query;

    if (result.error) {
      throw new Error(result.error.message);
    }

    const drafts = await Promise.all((result.data ?? []).map((draft) => getDraft(draft.id)));
    return drafts.filter((draft): draft is AdminDraftFAQ => draft !== null);
  }

  return {
    addQuestionAliasToFaq,
    addQuestionKeywordToFaq,
    approveDraft,
    async bulkApproveDrafts(ids, reviewer) {
      const productionFaqIds: string[] = [];

      for (const id of ids) {
        productionFaqIds.push(await approveDraft(id, reviewer));
        await reviewDraft({
          action: "bulk_approve",
          draftId: id,
          productionFaqId: productionFaqIds.at(-1) ?? null,
          reviewer
        });
      }

      return productionFaqIds;
    },
    async bulkRejectDrafts(ids, reviewer) {
      for (const id of ids) {
        await rejectDraft(id, reviewer);
        await reviewDraft({
          action: "bulk_reject",
          draftId: id,
          reviewer
        });
      }
    },
    createDraftFromQuestion,
    async createFaq(input) {
      const sourceId = await findOrCreateSource(input);
      const created = await client
        .from("faqs")
        .insert({
          answer: input.answer.trim(),
          answer_full: input.answer.trim(),
          answer_short: input.answer.trim(),
          audience: null,
          category: input.category.trim(),
          faq_code: createFaqCode("admin"),
          faculty_group: null,
          priority: "medium",
          question: input.question.trim(),
          source_page: null,
          source_quote: null,
          source_id: sourceId,
          status: input.status,
          valid_from: null,
          valid_until: null
        })
        .select()
        .single();

      const faq = requireData(created.data, created.error);
      await replaceAliasesAndKeywords(faq.id, input.aliases, input.keywords);
      return faq.id;
    },
    async createIngestionWithDrafts(input) {
      const sourceResult = await client
        .from("knowledge_sources")
        .insert({
          content_hash: input.contentHash ?? null,
          file_name: input.fileName ?? null,
          mime_type: input.mimeType ?? null,
          name: input.name.trim(),
          source_type: input.sourceType,
          status: "processed",
          url: input.url ?? null
        })
        .select()
        .single();
      const source = requireData(sourceResult.data, sourceResult.error);
      const jobResult = await client
        .from("ingestion_jobs")
        .insert({
          chunk_size_words: input.chunkSizeWords,
          completed_at: new Date().toISOString(),
          error_message: null,
          knowledge_source_id: source.id,
          overlap_words: input.overlapWords,
          parser: input.parser,
          status: "completed"
        })
        .select()
        .single();
      const job = requireData(jobResult.data, jobResult.error);

      for (const draft of input.drafts) {
        const draftResult = await client
          .from("draft_faqs")
          .insert({
            answer: draft.answer.trim(),
            category: draft.category.trim(),
            confidence: draft.confidence,
            duplicate_confidence: draft.duplicateConfidence,
            duplicate_of_draft_id: draft.duplicateOfDraftId,
            duplicate_of_faq_id: draft.duplicateOfFaqId,
            ingestion_job_id: job.id,
            knowledge_source_id: source.id,
            question: draft.question.trim(),
            reviewed_at: null,
            status: draft.status
          })
          .select()
          .single();
        const createdDraft = requireData(draftResult.data, draftResult.error);
        await replaceDraftKeywords(createdDraft.id, draft.keywords);
        await logImport({
          action: draft.status === "duplicate" ? "duplicate_detected" : "draft_created",
          draftFaqId: createdDraft.id,
          ingestionJobId: job.id,
          message:
            draft.status === "duplicate"
              ? "Draft FAQ marked as duplicate and kept out of production"
              : "Draft FAQ created for review",
          metadata: {
            duplicateConfidence: draft.duplicateConfidence,
            providerParser: input.parser
          }
        });
      }

      await logImport({
        action: "ingestion_completed",
        ingestionJobId: job.id,
        message: "Knowledge ingestion job completed",
        metadata: { draftCount: input.drafts.length }
      });

      return job.id;
    },
    async editDraft(id, input) {
      const updated = await client
        .from("draft_faqs")
        .update({
          answer: input.answer.trim(),
          category: input.category.trim(),
          confidence: input.confidence,
          question: input.question.trim(),
          status: "pending"
        })
        .eq("id", id);

      if (updated.error) {
        throw new Error(updated.error.message);
      }

      await replaceDraftKeywords(id, input.keywords);
      await reviewDraft({
        action: "edit",
        draftId: id
      });
    },
    getFaq,
    getQaInsights,
    getDraft,
    async listCategories() {
      const result = await client.from("faqs").select("category").order("category");

      if (result.error) {
        throw new Error(result.error.message);
      }

      return [...new Set((result.data ?? []).map((row) => row.category))];
    },
    async listDraftDuplicateChecks() {
      const drafts = await listDrafts();
      return drafts.map((draft) => ({
        id: draft.id,
        keywords: draft.keywords.map((keyword) => keyword.keyword),
        question: draft.question
      }));
    },
    listDrafts,
    listFaqs,
    listFreshnessItems,
    async listImportLogs() {
      const result = await client
        .from("knowledge_import_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data ?? [];
    },
    async listMissingQuestions() {
      const result = await client
        .from("question_logs")
        .select("*")
        .is("matched_faq_id", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return (result.data ?? []).map((row) => ({
        ...row,
        matched_faq: null
      }));
    },
    listQuestionReviewItems,
    listQuestionLogs,
    async listReviews() {
      const result = await client
        .from("knowledge_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return Promise.all(
        (result.data ?? []).map(async (review) => {
          if (!review.draft_faq_id) {
            return { ...review, draft_faq: null };
          }

          const draft = await client
            .from("draft_faqs")
            .select("id, question, status")
            .eq("id", review.draft_faq_id)
            .maybeSingle();

          if (draft.error) {
            throw new Error(draft.error.message);
          }

          return { ...review, draft_faq: draft.data };
        })
      );
    },
    linkQuestionToFaq,
    async markSourceReviewed(sourceId) {
      const updated = await client
        .from("sources")
        .update({
          last_verified_at: new Date().toISOString()
        })
        .eq("id", sourceId);

      if (updated.error) {
        throw new Error(updated.error.message);
      }
    },
    markQuestionReviewed,
    rejectDraft,
    async updateFaq(id, input) {
      const sourceId = await findOrCreateSource(input);
      const updated = await client
        .from("faqs")
        .update({
          answer: input.answer.trim(),
          answer_full: input.answer.trim(),
          answer_short: input.answer.trim(),
          category: input.category.trim(),
          question: input.question.trim(),
          source_id: sourceId,
          status: input.status
        })
        .eq("id", id);

      if (updated.error) {
        throw new Error(updated.error.message);
      }

      await replaceAliasesAndKeywords(id, input.aliases, input.keywords);
    }
  };
}
