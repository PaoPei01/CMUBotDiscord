import type { SearchResult } from "@campus-qa/knowledge";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

export const NOT_FOUND_MESSAGE =
  "ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ";
export const LOW_CONFIDENCE_MESSAGE =
  "พบข้อมูลที่ใกล้เคียงที่สุด อาจต้องตรวจสอบเพิ่มเติม";

type ButtonRow = ActionRowBuilder<ButtonBuilder>;

function truncate(value: string, maxLength = 1024): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function createFeedbackComponents(questionLogId: string): ButtonRow[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`feedback:${questionLogId}:up`)
        .setLabel("👍 ตรง")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`feedback:${questionLogId}:down`)
        .setLabel("👎 ไม่ตรง")
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 75) {
    return "สูง";
  }

  if (confidence >= 60) {
    return "ใกล้เคียง";
  }

  return "ต่ำ";
}

export function createAnswerComponents(questionLogId: string): ButtonRow[] {
  return createFeedbackComponents(questionLogId);
}

export function createNotFoundComponents(questionLogId: string): ButtonRow[] {
  return createFeedbackComponents(questionLogId);
}

export function createAnswerEmbed({
  question,
  result
}: {
  question: string;
  result: SearchResult;
}): EmbedBuilder {
  const sourceName = result.source?.name ?? "ไม่ระบุแหล่งที่มา";
  const sourceUrl = result.source?.url;
  const verifiedAt = result.source?.lastVerifiedAt ?? "ไม่ระบุ";
  const sourceValue = sourceUrl ? `[${sourceName}](${sourceUrl})` : sourceName;
  const fields = [];

  if (result.confidence >= 60 && result.confidence < 75) {
    fields.push({
      name: "หมายเหตุ",
      value: LOW_CONFIDENCE_MESSAGE
    });
  }

  fields.push(
    {
      name: "คำถาม",
      value: truncate(question)
    },
    {
      name: "คำตอบ",
      value: truncate(result.answer ?? NOT_FOUND_MESSAGE)
    },
    {
      name: "แหล่งที่มา",
      value: truncate(sourceValue)
    },
    {
      name: "อัปเดต/ยืนยันล่าสุด",
      value: verifiedAt
    },
    {
      name: "ความมั่นใจ",
      value: confidenceLabel(result.confidence)
    }
  );

  return new EmbedBuilder()
    .setTitle("คำตอบจากฐานข้อมูล")
    .setColor(0x1f8b4c)
    .addFields(fields);
}

export function createNotFoundEmbed(question: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("คำตอบจากฐานข้อมูล")
    .setColor(0xb45309)
    .addFields(
      {
        name: "คำถาม",
        value: truncate(question)
      },
      {
        name: "คำตอบ",
        value: NOT_FOUND_MESSAGE
      },
      {
        name: "ความมั่นใจ",
        value: "ไม่พบข้อมูลที่ยืนยันได้"
      }
    );
}
