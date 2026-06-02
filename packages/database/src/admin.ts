import { createClient } from "@supabase/supabase-js";

import type { FAQStatus, FeedbackVote } from "./types.js";

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

export type AdminDatabase = {
  createFaq(input: AdminFAQInput): Promise<string>;
  getFaq(id: string): Promise<AdminFAQ | null>;
  listCategories(): Promise<string[]>;
  listFaqs(filters: {
    category?: string;
    query?: string;
    status?: FAQStatus;
  }): Promise<AdminFAQ[]>;
  listMissingQuestions(): Promise<AdminQuestionLog[]>;
  listQuestionLogs(): Promise<AdminQuestionLog[]>;
  updateFaq(id: string, input: AdminFAQInput): Promise<void>;
};

type AdminOptions = {
  serviceRoleKey: string;
  supabaseUrl: string;
};

function compactValues(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
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

  async function findOrCreateSource(input: AdminFAQInput): Promise<string> {
    const sourceName = input.sourceName.trim();
    const sourceUrl = input.sourceUrl?.trim() || null;

    const existing = await client
      .from("sources")
      .select("*")
      .eq("name", sourceName)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      const updated = await client
        .from("sources")
        .update({
          last_verified_at: input.lastVerifiedAt,
          url: sourceUrl
        })
        .eq("id", existing.data.id)
        .select()
        .single();

      return requireData(updated.data, updated.error).id;
    }

    const created = await client
      .from("sources")
      .insert({
        last_verified_at: input.lastVerifiedAt,
        name: sourceName,
        source_type: "website",
        url: sourceUrl
      })
      .select()
      .single();

    return requireData(created.data, created.error).id;
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
        `question.ilike.%${filters.query}%,answer.ilike.%${filters.query}%`
      );
    }

    const result = await query;

    if (result.error) {
      throw new Error(result.error.message);
    }

    const faqs = await Promise.all((result.data ?? []).map((faq) => getFaq(faq.id)));
    return faqs.filter((faq): faq is AdminFAQ => faq !== null);
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

    return Promise.all(
      (result.data ?? []).map(async (log) => {
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
      })
    );
  }

  return {
    async createFaq(input) {
      const sourceId = await findOrCreateSource(input);
      const created = await client
        .from("faqs")
        .insert({
          answer: input.answer.trim(),
          category: input.category.trim(),
          question: input.question.trim(),
          source_id: sourceId,
          status: input.status
        })
        .select()
        .single();

      const faq = requireData(created.data, created.error);
      await replaceAliasesAndKeywords(faq.id, input.aliases, input.keywords);
      return faq.id;
    },
    getFaq,
    async listCategories() {
      const result = await client.from("faqs").select("category").order("category");

      if (result.error) {
        throw new Error(result.error.message);
      }

      return [...new Set((result.data ?? []).map((row) => row.category))];
    },
    listFaqs,
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
    listQuestionLogs,
    async updateFaq(id, input) {
      const sourceId = await findOrCreateSource(input);
      const updated = await client
        .from("faqs")
        .update({
          answer: input.answer.trim(),
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
