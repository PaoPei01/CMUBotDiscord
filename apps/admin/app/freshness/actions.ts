"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function markSourceReviewedAction(formData: FormData): Promise<void> {
  requireAdmin();

  const sourceId = stringValue(formData.get("sourceId"));

  if (!sourceId) {
    throw new Error("Source id is required");
  }

  await getAdminDatabase().markSourceReviewed(sourceId);

  revalidatePath("/freshness");
  redirect("/freshness?success=source-reviewed");
}
