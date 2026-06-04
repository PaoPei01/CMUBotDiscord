export type NaturalIntent = "campus_question" | "greeting" | "help" | "thanks" | "unknown";
export type NaturalTriggerType = "mention" | "prefix" | "channel";

export type NaturalQaGuardConfig = {
  allowedChannelIds: string[];
  enabled: boolean;
  minQuestionLength: number;
  prefixes: string[];
  requireMention: boolean;
};

export type NaturalQaMessageInput = {
  authorIsBot: boolean;
  botUserId: string;
  channelId: string;
  content: string;
  mentionsBot: boolean;
};

export type NaturalQaTriggerResult =
  | {
      question: string;
      shouldProcess: true;
      triggerType: NaturalTriggerType;
      wasMentioned: boolean;
    }
  | {
      reason:
        | "bot_author"
        | "channel_not_allowed"
        | "disabled"
        | "empty_allowed_channels"
        | "no_trigger"
        | "too_short";
      shouldProcess: false;
    };

const questionPatterns = [
  /\?/u,
  /(?:อะไร|ยังไง|อย่างไร|เมื่อไหร่|เท่าไหร่|เท่าไร|ที่ไหน|ไหม|มั้ย|หรือไม่)/u,
  /(?:ค่าเทอม|กำหนดการ|รายงานตัว|เอกสาร|บัญชี|cmu account|บัตรนักศึกษา|รูปถ่าย|หอพัก|ทุน|ลงทะเบียน|มหาวิทยาลัย|มช\.?)/iu
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function mentionPattern(botUserId: string): RegExp {
  return new RegExp(`<@!?${botUserId}>`, "gu");
}

export function cleanNaturalQuestion({
  botUserId,
  content,
  prefix
}: {
  botUserId: string;
  content: string;
  prefix?: string;
}): string {
  let cleaned = content.replace(mentionPattern(botUserId), " ");

  if (prefix) {
    cleaned = cleaned.trimStart().slice(prefix.length);
  }

  return normalizeWhitespace(cleaned);
}

export function detectNaturalIntent(question: string): NaturalIntent {
  const normalized = normalizeWhitespace(question).toLocaleLowerCase("th-TH");

  if (!normalized) {
    return "unknown";
  }

  if (/^(?:สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|hello|hi|hey)(?:\s|ครับ|ค่ะ|คะ|$)/iu.test(normalized)) {
    return "greeting";
  }

  if (/(?:ช่วย|help|ทำอะไรได้|ใช้งานยังไง|วิธีใช้|ถามอะไรได้)/iu.test(normalized)) {
    return "help";
  }

  if (/^(?:ขอบคุณ|ขอบใจ|thanks|thank you|thx)(?:\s|ครับ|ค่ะ|คะ|$)/iu.test(normalized)) {
    return "thanks";
  }

  if (questionPatterns.some((pattern) => pattern.test(normalized))) {
    return "campus_question";
  }

  return "unknown";
}

export function evaluateNaturalQaTrigger(
  input: NaturalQaMessageInput,
  config: NaturalQaGuardConfig
): NaturalQaTriggerResult {
  if (!config.enabled) {
    return { reason: "disabled", shouldProcess: false };
  }

  if (input.authorIsBot) {
    return { reason: "bot_author", shouldProcess: false };
  }

  if (config.allowedChannelIds.length === 0) {
    return { reason: "empty_allowed_channels", shouldProcess: false };
  }

  if (!config.allowedChannelIds.includes(input.channelId)) {
    return { reason: "channel_not_allowed", shouldProcess: false };
  }

  const prefix = config.prefixes.find((candidate) =>
    input.content.trimStart().startsWith(candidate)
  );
  const triggerType = input.mentionsBot
    ? "mention"
    : prefix
      ? "prefix"
      : config.requireMention
        ? null
        : "channel";

  if (!triggerType) {
    return { reason: "no_trigger", shouldProcess: false };
  }

  const question = cleanNaturalQuestion({
    botUserId: input.botUserId,
    content: input.content,
    prefix: triggerType === "prefix" ? prefix : undefined
  });

  if (question.length < config.minQuestionLength) {
    return { reason: "too_short", shouldProcess: false };
  }

  return {
    question,
    shouldProcess: true,
    triggerType,
    wasMentioned: input.mentionsBot
  };
}
