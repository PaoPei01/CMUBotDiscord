import type { DatabaseServiceClient, NewQuestionLog } from "@campus-qa/database";
import type { SearchResult } from "@campus-qa/knowledge";
import { describe, expect, it, vi } from "vitest";

import type { NaturalQaRuntimeConfig } from "../src/config.js";
import {
  handleNaturalQaMessage,
  NATURAL_QA_GREETING_RESPONSE,
  NATURAL_QA_HELP_RESPONSE,
  NATURAL_QA_SCOPE_RESPONSE,
  NATURAL_QA_THANKS_RESPONSE,
  type NaturalQaMessage
} from "../src/services/naturalQa.js";

const source = {
  createdAt: "2026-06-02T00:00:00Z",
  id: "source-1",
  lastVerifiedAt: "2026-06-02T00:00:00Z",
  name: "Verified Source",
  sourceType: "website",
  updatedAt: "2026-06-02T00:00:00Z",
  url: "https://example.edu"
};

const config: NaturalQaRuntimeConfig = {
  allowedChannelIds: ["channel-1"],
  enabled: true,
  minQuestionLength: 4,
  prefixes: ["ถาม:"],
  requireMention: true
};

function searchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    answer: "Verified answer",
    answerFull: "Verified answer",
    answerShort: "Verified answer",
    audience: "students",
    category: "Admissions",
    confidence: 80,
    facultyGroup: null,
    faqId: "faq-1",
    matchedQuestion: "Verified question",
    method: "keyword",
    priority: "medium",
    source,
    sourcePage: null,
    sourceQuote: null,
    status: "active",
    validFrom: null,
    validUntil: null,
    ...overrides
  };
}

function database() {
  const insertQuestionLog = vi.fn((input: NewQuestionLog) =>
    Promise.resolve({
      data: {
        confidence: input.confidence ?? null,
        createdAt: "2026-06-02T00:00:00Z",
        discordGuildId: input.discordGuildId ?? null,
        discordUserId: input.discordUserId ?? null,
        id: "log-1",
        intent: input.intent ?? null,
        matchedFaqId: input.matchedFaqId ?? null,
        method: input.method ?? null,
        responseTimeMs: input.responseTimeMs ?? null,
        triggerType: input.triggerType ?? null,
        userQuestion: input.userQuestion
      },
      error: null
    })
  );
  return {
    findFaqByExactQuestion: vi.fn(),
    findSimilarKnowledgeByEmbedding: vi.fn(),
    getActiveFaqs: vi.fn(),
    getExistingEmbeddingFaqIds: vi.fn(),
    getKnowledgeEntries: vi.fn(),
    insertFeedback: vi.fn(),
    insertQuestionLog,
    upsertFaqEmbedding: vi.fn()
  } satisfies DatabaseServiceClient;
}

function message(overrides: Partial<NaturalQaMessage> = {}) {
  const replies: unknown[] = [];
  const naturalMessage: NaturalQaMessage = {
    author: {
      bot: false,
      id: "user-1"
    },
    botUserId: "bot-1",
    channelId: "channel-1",
    content: "<@bot-1> ค่าเทอมเท่าไหร่",
    guildId: "guild-1",
    mentionsBot: true,
    reply: vi.fn((payload) => {
      replies.push(payload);
      return Promise.resolve(undefined);
    }),
    ...overrides
  };

  return { naturalMessage, replies };
}

function context(result: SearchResult = searchResult()) {
  const db = database();
  const searchKnowledge = vi.fn(() => Promise.resolve(result));

  return {
    database: db,
    insertQuestionLog: db.insertQuestionLog,
    knowledge: {
      searchKnowledge
    },
    logger: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    },
    searchKnowledge
  };
}

describe("handleNaturalQaMessage", () => {
  it("returns greeting, help, and thanks canned responses without searching", async () => {
    for (const [content, expected] of [
      ["<@bot-1> สวัสดีครับ", NATURAL_QA_GREETING_RESPONSE],
      ["<@bot-1> ช่วยบอกวิธีใช้", NATURAL_QA_HELP_RESPONSE],
      ["<@bot-1> ขอบคุณครับ", NATURAL_QA_THANKS_RESPONSE]
    ] as const) {
      const { naturalMessage, replies } = message({ content });
      const ctx = context();

      await handleNaturalQaMessage(naturalMessage, ctx, config);

      expect(replies).toEqual([expected]);
      expect(ctx.searchKnowledge).not.toHaveBeenCalled();
    }
  });

  it("does not reply to unknown intent without mention", async () => {
    const { naturalMessage, replies } = message({
      content: "ถาม: วันนี้อากาศดี",
      mentionsBot: false
    });
    const ctx = context();

    const result = await handleNaturalQaMessage(naturalMessage, ctx, config);

    expect(result.replied).toBe(false);
    expect(replies).toEqual([]);
  });

  it("replies with scope message to unknown intent with mention", async () => {
    const { naturalMessage, replies } = message({ content: "<@bot-1> วันนี้อากาศดี" });

    await handleNaturalQaMessage(naturalMessage, context(), config);

    expect(replies).toEqual([NATURAL_QA_SCOPE_RESPONSE]);
  });

  it("uses KnowledgeEngine for campus questions and logs metadata", async () => {
    const { naturalMessage, replies } = message();
    const ctx = context();

    await handleNaturalQaMessage(naturalMessage, ctx, config);

    expect(ctx.searchKnowledge).toHaveBeenCalledWith("ค่าเทอมเท่าไหร่");
    expect(ctx.insertQuestionLog).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "campus_question",
        matchedFaqId: "faq-1",
        triggerType: "mention",
        userQuestion: "ค่าเทอมเท่าไหร่"
      })
    );
    expect(replies).toHaveLength(1);
    expect(JSON.stringify(replies[0])).toContain("Verified answer");
  });

  it("returns not-found when no verified answer exists", async () => {
    const { naturalMessage, replies } = message();
    const ctx = context(
      searchResult({
        answer: null,
        answerFull: null,
        answerShort: null,
        confidence: 0,
        faqId: null,
        matchedQuestion: null,
        method: "none",
        source: null
      })
    );

    await handleNaturalQaMessage(naturalMessage, ctx, config);

    expect(replies).toHaveLength(1);
    expect(JSON.stringify(replies[0])).toContain(
      "ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ"
    );
  });
});
