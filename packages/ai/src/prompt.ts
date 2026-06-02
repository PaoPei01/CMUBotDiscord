import type { RetrievedContext } from "./provider.js";

export const AI_NOT_FOUND_MESSAGE =
  "ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ";

export function buildAnswerPrompt({
  contexts,
  question
}: {
  contexts: RetrievedContext[];
  question: string;
}): string {
  const contextText = contexts
    .map(
      (context, index) =>
        [
          `Context ${index + 1}`,
          `FAQ ID: ${context.faqId}`,
          `Source name: ${context.sourceName}`,
          context.sourceUrl ? `Source URL: ${context.sourceUrl}` : "Source URL: not provided",
          `Verified question: ${context.question}`,
          `Verified answer: ${context.answer}`
        ].join("\n")
    )
    .join("\n\n");

  return [
    "You are an answer composer for a verified university FAQ Discord bot.",
    "Answer only from the provided verified knowledge.",
    "Do not use outside knowledge.",
    "Do not guess.",
    `If information is insufficient, say exactly: ${AI_NOT_FOUND_MESSAGE}`,
    "Cite the source names used in the answer.",
    "Return only JSON with this shape:",
    '{"answer":"...","citedSourceNames":["..."],"notFound":false}',
    "",
    `User question: ${question}`,
    "",
    "Verified knowledge contexts:",
    contextText
  ].join("\n");
}
