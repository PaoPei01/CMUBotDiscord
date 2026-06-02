import { describe, expect, it } from "vitest";

import {
  KnowledgeEngine,
  normalizeSearchText,
  normalizeThaiText,
  normalizeWhitespace,
  removeRepeatedSpaces
} from "../src/index.js";
import type { KnowledgeEntry, KnowledgeRepository } from "../src/index.js";

const source = {
  createdAt: "2026-06-02T00:00:00Z",
  id: "source-1",
  lastVerifiedAt: "2026-06-02T00:00:00Z",
  name: "Verified Source",
  sourceType: "website",
  updatedAt: "2026-06-02T00:00:00Z",
  url: "https://example.edu"
};

const entries: KnowledgeEntry[] = [
  {
    aliases: ["จ่ายค่าเทอมวันไหน"],
    answer: "จ่ายค่าเทอมวันที่ 6-10 กรกฎาคม 2569",
    category: "ค่าเทอม",
    faqId: "tuition_fee_001",
    keywords: ["ค่าเทอม", "ชำระเงิน"],
    question: "ค่าธรรมเนียมการศึกษา ภาคเรียนที่ 1/2569 ต้องจ่ายวันไหน",
    source,
    updatedAt: "2026-06-02T00:00:00Z"
  },
  {
    aliases: ["เปิดอีเมล cmu ตอนไหน"],
    answer: "เปิดใช้งาน CMU Account ได้หลังรายงานตัวสมบูรณ์",
    category: "ไอทีบัญชี",
    faqId: "cmu_account_001",
    keywords: ["CMU Account", "อีเมลมหาวิทยาลัย"],
    question: "บัญชี CMU Account สามารถเริ่มเปิดใช้งานได้ตอนไหน",
    source,
    updatedAt: "2026-06-02T00:00:00Z"
  },
  {
    aliases: ["รูปทำบัตรนักศึกษา"],
    answer: "รูปถ่ายต้องเป็นรูปสีสัดส่วน 3:4",
    category: "รูปถ่าย",
    faqId: "photo_spec_001",
    keywords: ["รูปถ่าย", "บัตรนักศึกษา"],
    question: "ข้อกำหนดของไฟล์รูปถ่ายหน้าตรงเพื่อทำบัตรนักศึกษามีอะไรบ้าง",
    source,
    updatedAt: "2026-06-02T00:00:00Z"
  }
];

const repository: KnowledgeRepository = {
  getKnowledgeEntries() {
    return Promise.resolve(entries);
  }
};

describe("text normalization", () => {
  it("removes repeated spaces and normalizes whitespace", () => {
    expect(removeRepeatedSpaces("hello   world")).toBe("hello world");
    expect(normalizeWhitespace(" hello \n\t world ")).toBe("hello world");
  });

  it("lowercases English while preserving Thai text", () => {
    expect(normalizeSearchText("CMU Account เปิด ได้")).toBe("cmu account เปิด ได้");
    expect(normalizeThaiText("ค่าเทอม")).toBe("ค่าเทอม");
  });
});

describe("KnowledgeEngine", () => {
  it("returns exact matches with exact confidence", async () => {
    const result = await new KnowledgeEngine(repository).searchKnowledge(
      "ค่าธรรมเนียมการศึกษา ภาคเรียนที่ 1/2569 ต้องจ่ายวันไหน"
    );

    expect(result.method).toBe("exact");
    expect(result.faqId).toBe("tuition_fee_001");
    expect(result.confidence).toBe(100);
  });

  it("returns alias matches with alias confidence", async () => {
    const result = await new KnowledgeEngine(repository).searchKnowledge(
      "เปิดอีเมล cmu ตอนไหน"
    );

    expect(result.method).toBe("alias");
    expect(result.faqId).toBe("cmu_account_001");
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    expect(result.confidence).toBeLessThanOrEqual(95);
  });

  it("returns keyword matches with keyword confidence", async () => {
    const result = await new KnowledgeEngine(repository).searchKnowledge(
      "อยากรู้เรื่องชำระเงิน"
    );

    expect(result.method).toBe("keyword");
    expect(result.faqId).toBe("tuition_fee_001");
    expect(result.confidence).toBeGreaterThanOrEqual(75);
    expect(result.confidence).toBeLessThanOrEqual(90);
  });

  it("returns fuzzy matches with fuzzy confidence", async () => {
    const result = await new KnowledgeEngine(repository).searchKnowledge(
      "บัญชี cmu accunt เปิดใช้งานตอนไหน"
    );

    expect(result.method).toBe("fuzzy");
    expect(result.faqId).toBe("cmu_account_001");
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    expect(result.confidence).toBeLessThanOrEqual(80);
  });
});
