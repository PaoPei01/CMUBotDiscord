import Fuse from "fuse.js";

import { normalizeSearchText } from "../index.js";
import type {
  DraftFAQCandidate,
  DuplicateCheckDraft,
  DuplicateCheckFAQ,
  ExtractedFAQ
} from "./types.js";

function keywordOverlap(left: string[], right: string[]): number {
  const leftSet = new Set(left.map(normalizeSearchText).filter(Boolean));
  const rightSet = new Set(right.map(normalizeSearchText).filter(Boolean));

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  const matches = [...leftSet].filter((keyword) => rightSet.has(keyword)).length;
  return (matches / Math.max(leftSet.size, rightSet.size)) * 100;
}

function fuzzyQuestionScore(question: string, candidates: Array<{ id: string; question: string }>) {
  const fuse = new Fuse(candidates, {
    includeScore: true,
    keys: ["question"],
    threshold: 0.4
  });
  const match = fuse.search(question)[0];

  if (!match?.score && match?.score !== 0) {
    return null;
  }

  return {
    id: match.item.id,
    score: Math.round((1 - match.score) * 100)
  };
}

export function detectDuplicate(
  extracted: ExtractedFAQ,
  existingFaqs: DuplicateCheckFAQ[],
  existingDrafts: DuplicateCheckDraft[]
): Pick<
  DraftFAQCandidate,
  "duplicateConfidence" | "duplicateOfDraftId" | "duplicateOfFaqId" | "status"
> {
  const normalizedQuestion = normalizeSearchText(extracted.question);
  const exactFaq = existingFaqs.find(
    (faq) => normalizeSearchText(faq.question) === normalizedQuestion
  );

  if (exactFaq) {
    return {
      duplicateConfidence: 100,
      duplicateOfDraftId: null,
      duplicateOfFaqId: exactFaq.id,
      status: "duplicate"
    };
  }

  const exactDraft = existingDrafts.find(
    (draft) => normalizeSearchText(draft.question) === normalizedQuestion
  );

  if (exactDraft) {
    return {
      duplicateConfidence: 100,
      duplicateOfDraftId: exactDraft.id,
      duplicateOfFaqId: null,
      status: "duplicate"
    };
  }

  const fuzzyFaq = fuzzyQuestionScore(extracted.question, existingFaqs);
  const fuzzyDraft = fuzzyQuestionScore(extracted.question, existingDrafts);
  const bestFaqKeyword = existingFaqs
    .map((faq) => ({
      id: faq.id,
      score: keywordOverlap(extracted.keywords, faq.keywords ?? [])
    }))
    .sort((left, right) => right.score - left.score)[0];
  const bestDraftKeyword = existingDrafts
    .map((draft) => ({
      id: draft.id,
      score: keywordOverlap(extracted.keywords, draft.keywords ?? [])
    }))
    .sort((left, right) => right.score - left.score)[0];
  const faqScore = Math.max(fuzzyFaq?.score ?? 0, bestFaqKeyword?.score ?? 0);
  const draftScore = Math.max(fuzzyDraft?.score ?? 0, bestDraftKeyword?.score ?? 0);
  const duplicateConfidence = Math.round(Math.max(faqScore, draftScore));

  if (duplicateConfidence > 90) {
    return {
      duplicateConfidence,
      duplicateOfDraftId:
        draftScore >= faqScore ? (fuzzyDraft?.id ?? bestDraftKeyword?.id ?? null) : null,
      duplicateOfFaqId:
        faqScore > draftScore ? (fuzzyFaq?.id ?? bestFaqKeyword?.id ?? null) : null,
      status: "duplicate"
    };
  }

  return {
    duplicateConfidence,
    duplicateOfDraftId: null,
    duplicateOfFaqId: null,
    status: "pending"
  };
}

export function createDraftCandidates({
  existingDrafts,
  existingFaqs,
  extractedFaqs
}: {
  existingDrafts: DuplicateCheckDraft[];
  existingFaqs: DuplicateCheckFAQ[];
  extractedFaqs: ExtractedFAQ[];
}): DraftFAQCandidate[] {
  const drafts: DuplicateCheckDraft[] = [...existingDrafts];

  return extractedFaqs.map((extracted) => {
    const duplicate = detectDuplicate(extracted, existingFaqs, drafts);
    const candidate: DraftFAQCandidate = {
      ...extracted,
      ...duplicate
    };

    drafts.push({
      id: `candidate:${drafts.length}`,
      keywords: extracted.keywords,
      question: extracted.question
    });

    return candidate;
  });
}
