"use server";

import {
  createFAQExtractionProviderFromEnv,
  defaultChunkingOptions,
  generateDraftFAQsFromParsedInput,
  parseKnowledgeFile,
  parseKnowledgeUrl
} from "@campus-qa/knowledge";
import type { DraftFAQCandidate, ParsedKnowledgeInput } from "@campus-qa/knowledge";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

export type ImportKnowledgeActionState = {
  error: string | null;
};

function maxImportBytes(): number {
  const configured = Number(process.env.KNOWLEDGE_IMPORT_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0 ? configured : 10 * 1024 * 1024;
}

function numberValue(formData: FormData, key: string, fallback: number): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isParsedFileInput(
  input: ParsedKnowledgeInput
): input is ParsedKnowledgeInput & { contentHash: string; mimeType: string | null } {
  return (
    "contentHash" in input &&
    typeof input.contentHash === "string" &&
    "mimeType" in input &&
    (typeof input.mimeType === "string" || input.mimeType === null)
  );
}

function userFacingImportError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Import failed";
  }

  return error.message;
}

async function createKnowledgeDrafts(formData: FormData): Promise<number> {
  requireAdmin();

  const database = getAdminDatabase();
  const provider = createFAQExtractionProviderFromEnv({
    AI_PROVIDER: process.env.AI_PROVIDER,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GROQ_MODEL: process.env.GROQ_MODEL,
    GROQ_API_KEY: process.env.GROQ_API_KEY
  });
  const chunkSizeWords = numberValue(
    formData,
    "chunkSizeWords",
    defaultChunkingOptions.chunkSizeWords
  );
  const overlapWords = numberValue(
    formData,
    "overlapWords",
    defaultChunkingOptions.overlapWords
  );
  const url = stringValue(formData.get("url")).trim();
  const file = formData.get("file");
  const parsedInput =
    url.length > 0
      ? await parseKnowledgeUrl(url)
      : file instanceof File && file.size > 0
        ? await parseKnowledgeFile({
            bytes: new Uint8Array(await file.arrayBuffer()),
            contentType: file.type,
            fileName: file.name,
            maxBytes: maxImportBytes()
          })
        : null;

  if (!parsedInput) {
    throw new Error("Upload a supported file or provide a URL");
  }

  const isFileImport = isParsedFileInput(parsedInput);
  const [existingFaqs, existingDrafts] = await Promise.all([
    database.listFaqs({}),
    database.listDraftDuplicateChecks()
  ]);
  const generated: {
    chunksProcessed: number;
    drafts: DraftFAQCandidate[];
    providerName: string;
  } = await generateDraftFAQsFromParsedInput({
    existingDrafts,
    existingFaqs: existingFaqs.map((faq) => ({
      id: faq.id,
      keywords: faq.keywords.map((keyword) => keyword.keyword),
      question: faq.question
    })),
    input: parsedInput,
    options: {
      chunkSizeWords,
      overlapWords
    },
    provider
  });

  await database.createIngestionWithDrafts({
    chunkSizeWords,
    contentHash: isFileImport ? parsedInput.contentHash : null,
    drafts: generated.drafts.map((draft) => ({
      answer: draft.answer,
      category: draft.category,
      confidence: draft.confidence,
      duplicateConfidence: draft.duplicateConfidence,
      duplicateOfDraftId: draft.duplicateOfDraftId,
      duplicateOfFaqId: draft.duplicateOfFaqId,
      keywords: draft.keywords,
      question: draft.question,
      status: draft.status
    })),
    fileName: isFileImport ? parsedInput.name : null,
    mimeType: isFileImport ? parsedInput.mimeType : null,
    name: parsedInput.name,
    overlapWords,
    parser: `${parsedInput.sourceType}:${generated.providerName}`,
    sourceType: parsedInput.sourceType,
    url: parsedInput.url
  });

  revalidatePath("/drafts");
  revalidatePath("/reviews");
  return generated.drafts.length;
}

export async function importKnowledgeAction(formData: FormData): Promise<void> {
  const draftCount = await createKnowledgeDrafts(formData);
  redirect(`/drafts?success=imported&count=${draftCount}`);
}

export async function submitKnowledgeImportAction(
  _state: ImportKnowledgeActionState,
  formData: FormData
): Promise<ImportKnowledgeActionState> {
  let draftCount = 0;

  try {
    draftCount = await createKnowledgeDrafts(formData);
  } catch (error) {
    return {
      error: userFacingImportError(error)
    };
  }

  redirect(`/drafts?success=imported&count=${draftCount}`);
}
