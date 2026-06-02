import { createClient } from "@supabase/supabase-js";

import type { DatabaseError, DatabaseServiceClient } from "./services.js";
import type {
  FAQ,
  FAQStatus,
  Feedback,
  FeedbackVote,
  QuestionLog,
  Source
} from "./types.js";

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
  id: string;
  category: string;
  question: string;
  answer: string;
  source_id: string | null;
  status: FAQStatus;
  created_at: string;
  updated_at: string;
};

type FAQWithSourceRow = FAQRow & {
  source: SourceRow | null;
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

type SupabaseSchema = {
  public: {
    Tables: {
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseAdapterOptions = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

function mapError(error: { message: string } | null): DatabaseError | null {
  return error ? { message: error.message } : null;
}

function mapSource(row: SourceRow | null): Source | null {
  if (!row) {
    return null;
  }

  return {
    createdAt: row.created_at,
    id: row.id,
    lastVerifiedAt: row.last_verified_at,
    name: row.name,
    sourceType: row.source_type,
    updatedAt: row.updated_at,
    url: row.url
  };
}

function mapFaq(row: FAQRow): FAQ {
  return {
    answer: row.answer,
    category: row.category,
    createdAt: row.created_at,
    id: row.id,
    question: row.question,
    sourceId: row.source_id,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function mapFaqWithSource(row: FAQWithSourceRow): FAQ & { source: Source | null } {
  return {
    ...mapFaq(row),
    source: mapSource(row.source)
  };
}

function mapQuestionLog(row: QuestionLogRow): QuestionLog {
  return {
    confidence: row.confidence,
    createdAt: row.created_at,
    discordGuildId: row.discord_guild_id,
    discordUserId: row.discord_user_id,
    id: row.id,
    matchedFaqId: row.matched_faq_id,
    method: row.method,
    responseTimeMs: row.response_time_ms,
    userQuestion: row.user_question
  };
}

function mapFeedback(row: FeedbackRow): Feedback {
  return {
    comment: row.comment,
    createdAt: row.created_at,
    discordUserId: row.discord_user_id,
    id: row.id,
    questionLogId: row.question_log_id,
    vote: row.vote
  };
}

export function createSupabaseDatabaseService(
  options: SupabaseAdapterOptions
): DatabaseServiceClient {
  const client = createClient<SupabaseSchema>(
    options.supabaseUrl,
    options.serviceRoleKey,
    {
      auth: {
        persistSession: false
      }
    }
  );

  return {
    async findFaqByExactQuestion(question) {
      const { data, error } = await client
        .from("faqs")
        .select("*, source:sources(*)")
        .eq("status", "active")
        .eq("question", question)
        .maybeSingle<FAQWithSourceRow>();

      return {
        data: data ? mapFaqWithSource(data) : null,
        error: mapError(error)
      };
    },
    async getActiveFaqs() {
      const { data, error } = await client
        .from("faqs")
        .select("*, source:sources(*)")
        .eq("status", "active")
        .order("category", { ascending: true })
        .returns<FAQWithSourceRow[]>();

      return {
        data: data?.map(mapFaqWithSource) ?? null,
        error: mapError(error)
      };
    },
    async getKnowledgeEntries() {
      const { data, error } = await client
        .from("faqs")
        .select("*, source:sources(*)")
        .eq("status", "active")
        .order("category", { ascending: true })
        .returns<FAQWithSourceRow[]>();

      if (error) {
        return {
          data: null,
          error: mapError(error)
        };
      }

      const rows = data ?? [];
      const faqIds = rows.map((row) => row.id);

      if (faqIds.length === 0) {
        return {
          data: [],
          error: null
        };
      }

      const [aliasResult, keywordResult] = await Promise.all([
        client.from("faq_aliases").select("*").in("faq_id", faqIds),
        client.from("faq_keywords").select("*").in("faq_id", faqIds)
      ]);

      if (aliasResult.error) {
        return {
          data: null,
          error: mapError(aliasResult.error)
        };
      }

      if (keywordResult.error) {
        return {
          data: null,
          error: mapError(keywordResult.error)
        };
      }

      const aliasesByFaqId = new Map<string, string[]>();
      for (const alias of aliasResult.data ?? []) {
        aliasesByFaqId.set(alias.faq_id, [
          ...(aliasesByFaqId.get(alias.faq_id) ?? []),
          alias.alias
        ]);
      }

      const keywordsByFaqId = new Map<string, string[]>();
      for (const keyword of keywordResult.data ?? []) {
        keywordsByFaqId.set(keyword.faq_id, [
          ...(keywordsByFaqId.get(keyword.faq_id) ?? []),
          keyword.keyword
        ]);
      }

      return {
        data: rows.map((row) => ({
          ...mapFaqWithSource(row),
          aliases: aliasesByFaqId.get(row.id) ?? [],
          faqId: row.id,
          keywords: keywordsByFaqId.get(row.id) ?? []
        })),
        error: null
      };
    },
    async insertFeedback(input) {
      const { data, error } = await client
        .from("feedback")
        .insert({
          comment: input.comment ?? null,
          discord_user_id: input.discordUserId ?? null,
          question_log_id: input.questionLogId,
          vote: input.vote
        })
        .select()
        .single();

      return {
        data: data ? mapFeedback(data) : null,
        error: mapError(error)
      };
    },
    async insertQuestionLog(input) {
      const { data, error } = await client
        .from("question_logs")
        .insert({
          confidence: input.confidence ?? null,
          discord_guild_id: input.discordGuildId ?? null,
          discord_user_id: input.discordUserId ?? null,
          matched_faq_id: input.matchedFaqId ?? null,
          method: input.method ?? null,
          response_time_ms: input.responseTimeMs ?? null,
          user_question: input.userQuestion
        })
        .select()
        .single();

      return {
        data: data ? mapQuestionLog(data) : null,
        error: mapError(error)
      };
    }
  };
}
