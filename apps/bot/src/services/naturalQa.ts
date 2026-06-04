import { logQuestion } from "@campus-qa/database";
import type { DatabaseServiceClient } from "@campus-qa/database";
import type { SearchResult } from "@campus-qa/knowledge";
import type { Message, MessageReplyOptions } from "discord.js";

import type { NaturalQaRuntimeConfig } from "../config.js";
import type { BotLogger } from "./commandRegistry.js";
import {
  createAnswerComponents,
  createAnswerEmbed,
  createNotFoundComponents,
  createNotFoundEmbed,
  NOT_FOUND_MESSAGE
} from "../utils/formatAnswer.js";
import {
  detectNaturalIntent,
  evaluateNaturalQaTrigger,
  type NaturalIntent,
  type NaturalQaTriggerResult
} from "../utils/naturalIntent.js";

export const NATURAL_QA_GREETING_RESPONSE =
  "สวัสดีครับ ถามข้อมูลมหาวิทยาลัยจากฐานข้อมูลที่ตรวจสอบแล้วได้เลยครับ";
export const NATURAL_QA_HELP_RESPONSE =
  "ถามได้เรื่องข้อมูลมหาวิทยาลัยที่อยู่ในฐานข้อมูล เช่น ค่าเทอม กำหนดการ รายงานตัว เอกสาร และบัญชี CMU Account";
export const NATURAL_QA_THANKS_RESPONSE =
  "ยินดีครับ ถ้ามีคำถามเกี่ยวกับข้อมูลมหาวิทยาลัย ถามต่อได้เลยครับ";
export const NATURAL_QA_SCOPE_RESPONSE =
  "ตอนนี้ผมตอบได้เฉพาะคำถามเกี่ยวกับข้อมูลมหาวิทยาลัยจากฐานข้อมูลที่ตรวจสอบแล้วครับ";

export type NaturalQaMessage = {
  author: {
    bot: boolean;
    id: string;
  };
  botUserId: string;
  channelId: string;
  content: string;
  guildId: string | null;
  mentionsBot: boolean;
  reply(payload: MessageReplyOptions | string): Promise<unknown>;
};

export type NaturalQaHandleResult = {
  intent?: NaturalIntent;
  replied: boolean;
  trigger?: NaturalQaTriggerResult;
};

export type NaturalQaContext = {
  database: DatabaseServiceClient;
  knowledge: {
    searchKnowledge(question: string): Promise<SearchResult>;
  };
  logger: BotLogger;
};

function isExpired(validUntil: string | null): boolean {
  return validUntil ? new Date(validUntil).getTime() < Date.now() : false;
}

function answerableResult(result: SearchResult): boolean {
  return (
    result.status === "active" &&
    !isExpired(result.validUntil) &&
    Boolean(result.faqId) &&
    Boolean(result.answerShort ?? result.answer) &&
    result.confidence >= 60
  );
}

function notFoundResult(result: SearchResult): SearchResult {
  return {
    ...result,
    answer: null,
    answerFull: null,
    answerShort: null,
    confidence: 0,
    faqId: null,
    matchedQuestion: null,
    method: "none",
    source: null
  };
}

async function replyCanned(message: NaturalQaMessage, content: string): Promise<NaturalQaHandleResult> {
  await message.reply(content);
  return { replied: true };
}

export async function handleNaturalQaMessage(
  message: NaturalQaMessage,
  context: NaturalQaContext,
  config: NaturalQaRuntimeConfig
): Promise<NaturalQaHandleResult> {
  const trigger = evaluateNaturalQaTrigger(
    {
      authorIsBot: message.author.bot,
      botUserId: message.botUserId,
      channelId: message.channelId,
      content: message.content,
      mentionsBot: message.mentionsBot
    },
    config
  );

  if (!trigger.shouldProcess) {
    return { replied: false, trigger };
  }

  const intent = detectNaturalIntent(trigger.question);

  if (intent === "greeting") {
    return { ...(await replyCanned(message, NATURAL_QA_GREETING_RESPONSE)), intent, trigger };
  }

  if (intent === "help") {
    return { ...(await replyCanned(message, NATURAL_QA_HELP_RESPONSE)), intent, trigger };
  }

  if (intent === "thanks") {
    return { ...(await replyCanned(message, NATURAL_QA_THANKS_RESPONSE)), intent, trigger };
  }

  if (intent === "unknown") {
    if (trigger.wasMentioned) {
      return { ...(await replyCanned(message, NATURAL_QA_SCOPE_RESPONSE)), intent, trigger };
    }

    return { intent, replied: false, trigger };
  }

  const startedAt = Date.now();
  const rawSearchResult = await context.knowledge.searchKnowledge(trigger.question);
  const searchResult = answerableResult(rawSearchResult)
    ? rawSearchResult
    : notFoundResult(rawSearchResult);
  const responseTimeMs = Date.now() - startedAt;
  const questionLog = await logQuestion(context.database, {
    confidence: searchResult.confidence,
    discordGuildId: message.guildId,
    discordUserId: message.author.id,
    intent,
    matchedFaqId: searchResult.faqId,
    method: searchResult.method,
    responseTimeMs,
    triggerType: trigger.triggerType,
    userQuestion: trigger.question
  });

  context.logger.info(
    {
      confidence: searchResult.confidence,
      intent,
      matchedFaqId: searchResult.faqId,
      method: searchResult.method,
      questionLogId: questionLog.id,
      responseTimeMs,
      triggerType: trigger.triggerType
    },
    "Completed natural Q&A search"
  );

  if (searchResult.faqId && searchResult.confidence >= 60) {
    await message.reply({
      components: createAnswerComponents(questionLog.id),
      embeds: [createAnswerEmbed({ question: trigger.question, result: searchResult })]
    });
    return { intent, replied: true, trigger };
  }

  await message.reply({
    components: createNotFoundComponents(questionLog.id),
    embeds: [createNotFoundEmbed(trigger.question)]
  });

  return { intent, replied: true, trigger };
}

export function discordMessageToNaturalQaMessage(message: Message): NaturalQaMessage | null {
  const botUserId = message.client.user?.id;

  if (!botUserId) {
    return null;
  }

  return {
    author: {
      bot: message.author.bot,
      id: message.author.id
    },
    botUserId,
    channelId: message.channelId,
    content: message.content,
    guildId: message.guildId,
    mentionsBot: message.mentions.users.has(botUserId),
    reply(payload) {
      return message.reply(payload);
    }
  };
}

export { NOT_FOUND_MESSAGE };
