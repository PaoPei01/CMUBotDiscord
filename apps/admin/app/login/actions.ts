"use server";

import { redirect } from "next/navigation";

import { createAdminSession } from "../lib/auth";

export async function loginAction(formData: FormData): Promise<void> {
  await Promise.resolve();

  const password = formData.get("password");

  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    redirect("/login?error=1");
  }

  createAdminSession();
  redirect("/faq");
}
