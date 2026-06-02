import type { AIContext } from "./types.js";

export const AI_NOT_FOUND_MESSAGE =
  "ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ";

export function formatVerifiedContexts(contexts: AIContext[]): string {
  return contexts
    .map((context, index) =>
      [
        `Context ${index + 1}`,
        context.title ? `Title: ${context.title}` : null,
        context.sourceName ? `Source name: ${context.sourceName}` : null,
        context.sourceUrl ? `Source URL: ${context.sourceUrl}` : null,
        `Content: ${context.content}`
      ]
        .filter((line): line is string => line !== null)
        .join("\n")
    )
    .join("\n\n");
}

export function buildAnswerPrompt({
  contexts,
  question
}: {
  contexts: AIContext[];
  question: string;
}): string {
  return [
    "You are a university Q&A assistant.",
    "",
    "Answer only from the verified knowledge below.",
    "Do not use outside knowledge.",
    "Do not guess.",
    "Do not add facts not present in the context.",
    "If the context is insufficient, respond exactly:",
    `"${AI_NOT_FOUND_MESSAGE}"`,
    "",
    "User question:",
    question,
    "",
    "Verified knowledge:",
    formatVerifiedContexts(contexts),
    "",
    "Return a concise Thai answer.",
    "Include source names when possible."
  ].join("\n");
}
