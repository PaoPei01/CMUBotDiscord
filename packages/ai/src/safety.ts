import { AI_NOT_FOUND_MESSAGE } from "./prompt.js";
import type { AIAnswer, RetrievedContext } from "./provider.js";

export function assertRetrievedContexts(contexts: RetrievedContext[]): void {
  if (contexts.length === 0) {
    throw new Error("AI answer generation requires retrieved verified context");
  }

  for (const context of contexts) {
    if (!context.faqId || !context.answer.trim() || !context.sourceName.trim()) {
      throw new Error("AI context must include FAQ id, answer, and source name");
    }
  }
}

export function parseAIAnswer(rawText: string): AIAnswer {
  const trimmed = rawText.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/u, "").trim()
    : trimmed;
  const parsed = JSON.parse(jsonText) as Partial<AIAnswer>;

  return {
    answer: typeof parsed.answer === "string" ? parsed.answer.trim() : "",
    citedSourceNames: Array.isArray(parsed.citedSourceNames)
      ? parsed.citedSourceNames.filter((name): name is string => typeof name === "string")
      : [],
    notFound: parsed.notFound === true
  };
}

export function guardAIAnswer(answer: AIAnswer, contexts: RetrievedContext[]): AIAnswer {
  assertRetrievedContexts(contexts);

  if (answer.notFound || answer.answer === AI_NOT_FOUND_MESSAGE) {
    return {
      answer: AI_NOT_FOUND_MESSAGE,
      citedSourceNames: [],
      notFound: true
    };
  }

  const allowedSourceNames = new Set(contexts.map((context) => context.sourceName));
  const citedSourceNames = answer.citedSourceNames.filter((name) =>
    allowedSourceNames.has(name)
  );

  if (!answer.answer || citedSourceNames.length === 0) {
    return {
      answer: AI_NOT_FOUND_MESSAGE,
      citedSourceNames: [],
      notFound: true
    };
  }

  return {
    answer: answer.answer,
    citedSourceNames,
    notFound: false
  };
}
