"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";
import { parseFaqForm } from "../lib/forms";

export async function createFaqAction(formData: FormData): Promise<void> {
  requireAdmin();

  const database = getAdminDatabase();
  const input = parseFaqForm(formData);
  const faqId = await database.createFaq(input);

  revalidatePath("/faq");
  redirect(`/faq/${faqId}/edit?success=created`);
}

export async function updateFaqAction(
  id: string,
  formData: FormData
): Promise<void> {
  requireAdmin();

  const database = getAdminDatabase();
  const input = parseFaqForm(formData);
  await database.updateFaq(id, input);

  revalidatePath("/faq");
  revalidatePath(`/faq/${id}/edit`);
  redirect(`/faq/${id}/edit?success=updated`);
}
