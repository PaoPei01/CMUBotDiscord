import { createClient } from "@supabase/supabase-js";

import { parseFaqCsv } from "./parseFaqCsv.js";
import { validateFaqImportRow } from "./validateFaqImportRow.js";
import type {
  FAQImportError,
  FAQImportResult,
  FaqImportInput,
  ValidatedFaqImportRow
} from "./types.js";

type SourceRow = {
  id: string;
  name: string;
  url: string | null;
};

type FAQRow = {
  faq_code: string;
  id: string;
};

type SupabaseImportSchema = {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: {
          last_verified_at?: string | null;
          name: string;
          source_type?: string;
          url?: string | null;
        };
        Relationships: [];
        Update: {
          last_verified_at?: string | null;
          name?: string;
          source_type?: string;
          url?: string | null;
        };
      };
      faqs: {
        Row: FAQRow;
        Insert: {
          answer?: string;
          answer_full?: string | null;
          answer_short: string;
          audience?: string | null;
          category: string;
          faculty_group?: string | null;
          faq_code: string;
          priority?: string;
          question: string;
          source_id?: string | null;
          source_page?: string | null;
          source_quote?: string | null;
          status?: string;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [];
        Update: Partial<SupabaseImportSchema["public"]["Tables"]["faqs"]["Insert"]>;
      };
      faq_aliases: {
        Row: { faq_id: string; id: string };
        Insert: { alias: string; faq_id: string };
        Relationships: [];
        Update: never;
      };
      faq_keywords: {
        Row: { faq_id: string; id: string };
        Insert: { faq_id: string; keyword: string };
        Relationships: [];
        Update: never;
      };
      faq_relations: {
        Row: { id: string };
        Insert: { faq_id: string; related_faq_id: string };
        Relationships: [];
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function emptySummary(dryRun: boolean, totalRows: number): FAQImportResult {
  return {
    aliasesImported: 0,
    createdFaqs: 0,
    createdSources: 0,
    dryRun,
    keywordsImported: 0,
    relatedFaqLinksImported: 0,
    skippedRows: 0,
    totalRows,
    updatedFaqs: 0,
    updatedSources: 0,
    validationErrors: []
  };
}

function duplicateError(row: ValidatedFaqImportRow): FAQImportError {
  return {
    error: "FAQ ID must be unique",
    faqId: row.faqId,
    field: "FAQ ID",
    rowNumber: row.rowNumber
  };
}

function sourceKey(row: ValidatedFaqImportRow): string {
  return `${row.sourceName}\n${row.sourceUrl ?? ""}`;
}

function sourceQuery(
  client: ReturnType<typeof createClient<SupabaseImportSchema>>,
  row: ValidatedFaqImportRow
) {
  const query = client.from("sources").select("id,name,url").eq("name", row.sourceName);
  return row.sourceUrl ? query.eq("url", row.sourceUrl) : query.is("url", null);
}

async function loadExistingFaqCodes(
  client: ReturnType<typeof createClient<SupabaseImportSchema>>,
  faqCodes: string[]
): Promise<Map<string, string>> {
  if (faqCodes.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("faqs")
    .select("id,faq_code")
    .in("faq_code", [...new Set(faqCodes)]);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((faq) => [faq.faq_code, faq.id]));
}

export async function importFaqs(input: FaqImportInput): Promise<FAQImportResult> {
  const parsed = parseFaqCsv(input.csvText);
  const summary = emptySummary(input.dryRun, parsed.rows.length);
  const rows: ValidatedFaqImportRow[] = [];
  const seenFaqIds = new Set<string>();

  summary.validationErrors.push(...parsed.errors);

  for (const parsedRow of parsed.rows) {
    const validated = validateFaqImportRow(parsedRow.raw, parsedRow.rowNumber);
    summary.validationErrors.push(...validated.errors);

    if (!validated.row) {
      continue;
    }

    if (seenFaqIds.has(validated.row.faqId)) {
      summary.validationErrors.push(duplicateError(validated.row));
      continue;
    }

    seenFaqIds.add(validated.row.faqId);
    rows.push(validated.row);
  }

  summary.skippedRows = summary.validationErrors.length > 0
    ? new Set(summary.validationErrors.map((item) => item.rowNumber)).size
    : 0;

  if (!input.dryRun && summary.validationErrors.length > 0) {
    return summary;
  }

  const client = createClient<SupabaseImportSchema>(
    input.supabaseUrl,
    input.serviceRoleKey,
    {
      auth: {
        persistSession: false
      }
    }
  );
  const sourceRows = [...new Map(rows.map((row) => [sourceKey(row), row])).values()];
  const existingFaqs = await loadExistingFaqCodes(
    client,
    rows.map((row) => row.faqId)
  );

  for (const row of sourceRows) {
    const existing = await sourceQuery(client, row).maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      summary.updatedSources += 1;
    } else {
      summary.createdSources += 1;
    }
  }

  for (const row of rows) {
    if (existingFaqs.has(row.faqId)) {
      summary.updatedFaqs += 1;
    } else {
      summary.createdFaqs += 1;
    }
    summary.aliasesImported += row.aliases.length;
    summary.keywordsImported += row.keywords.length;
    summary.relatedFaqLinksImported += row.relatedFaqIds.length;
  }

  if (input.dryRun || rows.length === 0) {
    return summary;
  }

  const sourceIds = new Map<string, string>();

  for (const row of sourceRows) {
    const existing = await sourceQuery(client, row).maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      const updated = await client
        .from("sources")
        .update({
          last_verified_at: row.lastVerified,
          source_type: "document",
          url: row.sourceUrl
        })
        .eq("id", existing.data.id)
        .select("id,name,url")
        .single();

      if (updated.error) {
        throw new Error(updated.error.message);
      }

      sourceIds.set(sourceKey(row), updated.data.id);
      continue;
    }

    const created = await client
      .from("sources")
      .insert({
        last_verified_at: row.lastVerified,
        name: row.sourceName,
        source_type: "document",
        url: row.sourceUrl
      })
      .select("id,name,url")
      .single();

    if (created.error) {
      throw new Error(created.error.message);
    }

    sourceIds.set(sourceKey(row), created.data.id);
  }

  const faqCodeToId = new Map(existingFaqs);

  for (const row of rows) {
    const sourceId = sourceIds.get(sourceKey(row)) ?? null;
    const payload = {
      answer: row.answerShort,
      answer_full: row.answerFull,
      answer_short: row.answerShort,
      audience: row.audience,
      category: row.category,
      faculty_group: row.facultyGroup,
      faq_code: row.faqId,
      priority: row.priority,
      question: row.question,
      source_id: sourceId,
      source_page: row.sourcePage,
      source_quote: row.sourceQuote,
      status: row.status,
      valid_from: row.validFrom,
      valid_until: row.validUntil
    };
    const existingId = faqCodeToId.get(row.faqId);
    const result = existingId
      ? await client
          .from("faqs")
          .update(payload)
          .eq("id", existingId)
          .select("id,faq_code")
          .single()
      : await client.from("faqs").insert(payload).select("id,faq_code").single();

    if (result.error) {
      throw new Error(result.error.message);
    }

    faqCodeToId.set(row.faqId, result.data.id);

    await client.from("faq_aliases").delete().eq("faq_id", result.data.id);
    await client.from("faq_keywords").delete().eq("faq_id", result.data.id);

    if (row.aliases.length > 0) {
      const aliases = await client.from("faq_aliases").insert(
        row.aliases.map((alias) => ({
          alias,
          faq_id: result.data.id
        }))
      );

      if (aliases.error) {
        throw new Error(aliases.error.message);
      }
    }

    if (row.keywords.length > 0) {
      const keywords = await client.from("faq_keywords").insert(
        row.keywords.map((keyword) => ({
          faq_id: result.data.id,
          keyword
        }))
      );

      if (keywords.error) {
        throw new Error(keywords.error.message);
      }
    }
  }

  const relatedCodes = rows.flatMap((row) => row.relatedFaqIds);
  const relatedExisting = await loadExistingFaqCodes(client, relatedCodes);
  for (const [faqCode, faqId] of relatedExisting) {
    faqCodeToId.set(faqCode, faqId);
  }

  const importedFaqIds = rows
    .map((row) => faqCodeToId.get(row.faqId))
    .filter((id): id is string => Boolean(id));

  if (importedFaqIds.length > 0) {
    await client.from("faq_relations").delete().in("faq_id", importedFaqIds);
  }

  const relationPayload = rows.flatMap((row) => {
    const faqId = faqCodeToId.get(row.faqId);

    if (!faqId) {
      return [];
    }

    return row.relatedFaqIds
      .map((relatedFaqCode) => {
        const relatedFaqId = faqCodeToId.get(relatedFaqCode);
        return relatedFaqId
          ? {
              faq_id: faqId,
              related_faq_id: relatedFaqId
            }
          : null;
      })
      .filter((relation): relation is { faq_id: string; related_faq_id: string } =>
        Boolean(relation)
      );
  });

  if (relationPayload.length > 0) {
    const relations = await client.from("faq_relations").insert(relationPayload);

    if (relations.error) {
      throw new Error(relations.error.message);
    }
  }

  summary.relatedFaqLinksImported = relationPayload.length;
  return summary;
}
