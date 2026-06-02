import { describe, expect, it } from "vitest";

import { formatAnswerEmbed } from "../src/discord/formatAnswerEmbed.js";
import type { KnowledgeSearchResult } from "../src/services/knowledgeSearch.js";

function searchResult(overrides: Partial<KnowledgeSearchResult> = {}): KnowledgeSearchResult {
  return {
    answerFull: "Detailed verified answer",
    answerShort: "Short verified answer",
    audience: null,
    category: "รูปถ่าย",
    confidence: 80,
    facultyGroup: null,
    faqId: "faq-1",
    lastVerifiedAt: "2026-06-02T00:00:00Z",
    method: "keyword",
    priority: "medium",
    question: "รูปทำบัตรนักศึกษาต้องเป็นแบบไหน",
    sourceName: "ประกาศมหาวิทยาลัย.pdf",
    sourcePage: null,
    sourceQuote: null,
    sourceUrl: null,
    validFrom: null,
    validUntil: null,
    ...overrides
  };
}

describe("formatAnswerEmbed", () => {
  it("formats a concise user-facing answer without internal confidence metadata", () => {
    const embed = formatAnswerEmbed({
      answer: "ต้องเป็นรูปถ่ายสีหน้าตรงเต็มหน้า",
      result: searchResult(),
      sourceNames: ["ประกาศมหาวิทยาลัย.pdf"]
    });

    expect(embed.title).toBe("คำตอบ");
    expect(embed.description).toContain("ต้องเป็นรูปถ่ายสีหน้าตรงเต็มหน้า ครับ");
    expect(embed.description).toContain("สามารถกดปุ่ม feedback");
    expect(JSON.stringify(embed)).toContain("ประกาศมหาวิทยาลัย.pdf");
    expect(JSON.stringify(embed)).not.toContain("ความมั่นใจ");
    expect(JSON.stringify(embed)).not.toContain("สถานะข้อมูล");
    expect(JSON.stringify(embed)).not.toContain("medium");
  });
});
