"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

function splitValues(value: unknown): string[] {
  return stringValue(value)
    .split(/[\n,]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function selectedDraftIds(formData: FormData): string[] {
  return formData
    .getAll("draftId")
    .map(stringValue)
    .filter(Boolean);
}

export async function approveDraftAction(id: string): Promise<void> {
  requireAdmin();

  const database = getAdminDatabase();
  await database.approveDraft(id, "admin");

  revalidatePath("/drafts");
  revalidatePath(`/drafts/${id}`);
  redirect(`/drafts/${id}?success=approved`);
}

export async function rejectDraftAction(id: string): Promise<void> {
  requireAdmin();

  const database = getAdminDatabase();
  await database.rejectDraft(id, "admin");

  revalidatePath("/drafts");
  revalidatePath(`/drafts/${id}`);
  redirect(`/drafts/${id}?success=rejected`);
}

export async function editDraftAction(id: string, formData: FormData): Promise<void> {
  requireAdmin();

  const database = getAdminDatabase();
  await database.editDraft(id, {
    answer: stringValue(formData.get("answer")),
    category: stringValue(formData.get("category")),
    confidence: Number(formData.get("confidence") ?? 0),
    keywords: splitValues(formData.get("keywords")),
    question: stringValue(formData.get("question"))
  });

  revalidatePath("/drafts");
  revalidatePath(`/drafts/${id}`);
  redirect(`/drafts/${id}?success=updated`);
}

export async function bulkApproveDraftsAction(formData: FormData): Promise<void> {
  requireAdmin();

  const ids = selectedDraftIds(formData);
  const database = getAdminDatabase();
  await database.bulkApproveDrafts(ids, "admin");

  revalidatePath("/drafts");
  redirect(`/drafts?success=bulk-approved&count=${ids.length}`);
}

export async function bulkRejectDraftsAction(formData: FormData): Promise<void> {
  requireAdmin();

  const ids = selectedDraftIds(formData);
  const database = getAdminDatabase();
  await database.bulkRejectDrafts(ids, "admin");

  revalidatePath("/drafts");
  redirect(`/drafts?success=bulk-rejected&count=${ids.length}`);
}
