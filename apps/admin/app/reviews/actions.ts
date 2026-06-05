"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function reviewInput(formData: FormData): { faqId: string; questionLogId: string } {
  return {
    faqId: stringValue(formData.get("faqId")),
    questionLogId: stringValue(formData.get("questionLogId"))
  };
}

function requireQuestionLogId(formData: FormData): string {
  const questionLogId = stringValue(formData.get("questionLogId"));

  if (!questionLogId) {
    throw new Error("Question log id is required");
  }

  return questionLogId;
}

function requireFaqReviewInput(formData: FormData): { faqId: string; questionLogId: string } {
  const input = reviewInput(formData);

  if (!input.questionLogId || !input.faqId) {
    throw new Error("Question log id and FAQ id are required");
  }

  return input;
}

export async function markReviewedAction(formData: FormData): Promise<void> {
  requireAdmin();

  await getAdminDatabase().markQuestionReviewed(requireQuestionLogId(formData));

  revalidatePath("/reviews");
  redirect("/reviews?success=reviewed");
}

export async function createDraftFromReviewAction(formData: FormData): Promise<void> {
  requireAdmin();

  const draftId = await getAdminDatabase().createDraftFromQuestion(
    requireQuestionLogId(formData)
  );

  revalidatePath("/reviews");
  revalidatePath("/drafts");
  redirect(`/drafts/${draftId}?success=created-from-review`);
}

export async function linkQuestionToFaqAction(formData: FormData): Promise<void> {
  requireAdmin();

  await getAdminDatabase().linkQuestionToFaq(requireFaqReviewInput(formData));

  revalidatePath("/reviews");
  redirect("/reviews?success=linked");
}

export async function addAliasFromQuestionAction(formData: FormData): Promise<void> {
  requireAdmin();

  await getAdminDatabase().addQuestionAliasToFaq(requireFaqReviewInput(formData));

  revalidatePath("/reviews");
  revalidatePath("/faq");
  redirect("/reviews?success=alias-added");
}

export async function addKeywordFromQuestionAction(formData: FormData): Promise<void> {
  requireAdmin();

  await getAdminDatabase().addQuestionKeywordToFaq(requireFaqReviewInput(formData));

  revalidatePath("/reviews");
  revalidatePath("/faq");
  redirect("/reviews?success=keyword-added");
}
