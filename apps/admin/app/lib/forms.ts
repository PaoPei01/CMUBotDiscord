import type { AdminFAQInput } from "@campus-qa/database";

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function splitLines(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseFaqForm(formData: FormData): AdminFAQInput {
  const status = requiredString(formData, "status");

  if (status !== "active" && status !== "inactive") {
    throw new Error("status must be active or inactive");
  }

  return {
    aliases: splitLines(optionalString(formData, "aliases")),
    answer: requiredString(formData, "answer"),
    category: requiredString(formData, "category"),
    keywords: splitLines(optionalString(formData, "keywords")),
    lastVerifiedAt: optionalString(formData, "lastVerifiedAt"),
    question: requiredString(formData, "question"),
    sourceName: requiredString(formData, "sourceName"),
    sourceUrl: optionalString(formData, "sourceUrl"),
    status
  };
}
