import { logQuestion } from "@campus-qa/database";
import type { DatabaseServiceClient } from "@campus-qa/database";
import type { QuestionLog } from "@campus-qa/database";
import type { AIProvider } from "@campus-qa/ai";
import type { SearchResult } from "@campus-qa/knowledge";
import type { Message, MessageReplyOptions } from "discord.js";

import type { NaturalQaRuntimeConfig } from "../config.js";
import type { BotLogger } from "./commandRegistry.js";
import { composeAskAnswer } from "./aiAnswerComposer.js";
import {
  createAnswerComponents,
  createNaturalAnswerEmbed,
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
  aiProvider?: AIProvider | null;
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
    Boolean(result.source?.name)
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

async function safeLogNaturalQuestion({
  context,
  guildId,
  intent,
  message,
  responseTimeMs,
  searchResult,
  trigger
}: {
  context: NaturalQaContext;
  guildId: string | null;
  intent: NaturalIntent;
  message: NaturalQaMessage;
  responseTimeMs: number;
  searchResult: SearchResult;
  trigger: Extract<NaturalQaTriggerResult, { shouldProcess: true }>;
}): Promise<QuestionLog | null> {
  try {
    return await logQuestion(context.database, {
      confidence: searchResult.confidence,
      discordGuildId: guildId,
      discordUserId: message.author.id,
      intent,
      matchedFaqId: searchResult.faqId,
      method: searchResult.method,
      responseTimeMs,
      triggerType: trigger.triggerType,
      userQuestion: trigger.question
    });
  } catch {
    context.logger.warn(
      {
        intent,
        triggerType: trigger.triggerType
      },
      "Natural Q&A question logging failed"
    );
    return null;
  }
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
  const answerComposition = await composeAskAnswer({
    aiProvider: context.aiProvider ?? null,
    question: trigger.question,
    searchResult
  });
  const responseTimeMs = Date.now() - startedAt;
  const questionLog = await safeLogNaturalQuestion({
    context,
    guildId: message.guildId,
    intent,
    message,
    responseTimeMs,
    searchResult: answerComposition.result,
    trigger
  });

  context.logger.info(
    {
      ai_provider: answerComposition.aiProvider,
      ai_used: answerComposition.aiUsed,
      confidence: answerComposition.result.confidence,
      failure_reason: answerComposition.failureReason,
      intent,
      matchedFaqId: answerComposition.result.faqId,
      method: answerComposition.result.method,
      prompt_context_count: answerComposition.promptContextCount,
      questionLogId: questionLog?.id ?? null,
      responseTimeMs,
      triggerType: trigger.triggerType
    },
    "Completed natural Q&A search"
  );

  if (answerComposition.shouldReplyWithAnswer) {
    await message.reply({
      ...(questionLog ? { components: createAnswerComponents(questionLog.id) } : {}),
      embeds: [
        createNaturalAnswerEmbed({
          question: trigger.question,
          result: answerComposition.result
        })
      ]
    });
    return { intent, replied: true, trigger };
  }

  await message.reply({
    ...(questionLog ? { components: createNotFoundComponents(questionLog.id) } : {}),
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
