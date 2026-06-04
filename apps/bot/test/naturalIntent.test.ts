import { describe, expect, it } from "vitest";

import {
  cleanNaturalQuestion,
  detectNaturalIntent,
  evaluateNaturalQaTrigger
} from "../src/utils/naturalIntent.js";

const enabledConfig = {
  allowedChannelIds: ["channel-1"],
  enabled: true,
  minQuestionLength: 4,
  prefixes: ["ถาม:", "ถาม"],
  requireMention: true
};

describe("natural Q&A trigger guard", () => {
  it("is disabled by default", () => {
    const result = evaluateNaturalQaTrigger(
      {
        authorIsBot: false,
        botUserId: "bot-1",
        channelId: "channel-1",
        content: "<@bot-1> ค่าเทอมเท่าไหร่",
        mentionsBot: true
      },
      { ...enabledConfig, enabled: false }
    );

    expect(result).toEqual({ reason: "disabled", shouldProcess: false });
  });

  it("blocks natural Q&A when allowed channel ids are empty", () => {
    const result = evaluateNaturalQaTrigger(
      {
        authorIsBot: false,
        botUserId: "bot-1",
        channelId: "channel-1",
        content: "<@bot-1> ค่าเทอมเท่าไหร่",
        mentionsBot: true
      },
      { ...enabledConfig, allowedChannelIds: [] }
    );

    expect(result).toEqual({ reason: "empty_allowed_channels", shouldProcess: false });
  });

  it("extracts questions from mention triggers", () => {
    const result = evaluateNaturalQaTrigger(
      {
        authorIsBot: false,
        botUserId: "bot-1",
        channelId: "channel-1",
        content: "<@bot-1> ค่าเทอมเท่าไหร่",
        mentionsBot: true
      },
      enabledConfig
    );

    expect(result).toMatchObject({
      question: "ค่าเทอมเท่าไหร่",
      shouldProcess: true,
      triggerType: "mention"
    });
  });

  it("extracts questions from prefix triggers", () => {
    const result = evaluateNaturalQaTrigger(
      {
        authorIsBot: false,
        botUserId: "bot-1",
        channelId: "channel-1",
        content: "ถาม: รายงานตัวเมื่อไหร่",
        mentionsBot: false
      },
      enabledConfig
    );

    expect(result).toMatchObject({
      question: "รายงานตัวเมื่อไหร่",
      shouldProcess: true,
      triggerType: "prefix"
    });
  });

  it("rejects short questions", () => {
    const result = evaluateNaturalQaTrigger(
      {
        authorIsBot: false,
        botUserId: "bot-1",
        channelId: "channel-1",
        content: "<@bot-1> ไง",
        mentionsBot: true
      },
      enabledConfig
    );

    expect(result).toEqual({ reason: "too_short", shouldProcess: false });
  });

  it("ignores bot messages", () => {
    const result = evaluateNaturalQaTrigger(
      {
        authorIsBot: true,
        botUserId: "bot-1",
        channelId: "channel-1",
        content: "<@bot-1> ค่าเทอมเท่าไหร่",
        mentionsBot: true
      },
      enabledConfig
    );

    expect(result).toEqual({ reason: "bot_author", shouldProcess: false });
  });
});

describe("natural intent detection", () => {
  it("detects greeting, help, thanks, campus question, and unknown intents", () => {
    expect(detectNaturalIntent("สวัสดีครับ")).toBe("greeting");
    expect(detectNaturalIntent("ช่วยบอกวิธีใช้หน่อย")).toBe("help");
    expect(detectNaturalIntent("ขอบคุณครับ")).toBe("thanks");
    expect(detectNaturalIntent("ค่าเทอมต้องจ่ายเมื่อไหร่")).toBe("campus_question");
    expect(detectNaturalIntent("วันนี้อากาศดี")).toBe("unknown");
  });

  it("removes bot mention and configured prefix from questions", () => {
    expect(
      cleanNaturalQuestion({
        botUserId: "bot-1",
        content: "<@!bot-1> ถาม: CMU Account เปิดตอนไหน",
        prefix: "ถาม:"
      })
    ).toBe("CMU Account เปิดตอนไหน");
  });
});
