import type { SearchResult } from "@campus-qa/database";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

export const NOT_FOUND_MESSAGE =
  "ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ";

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
  const verifiedAt = result.source?.lastVerifiedAt ?? result.faq.updatedAt;
  const sourceValue = sourceUrl ? `[${sourceName}](${sourceUrl})` : sourceName;

  return new EmbedBuilder()
    .setTitle("คำตอบจากฐานข้อมูล")
    .setColor(0x1f8b4c)
    .addFields(
      {
        name: "คำถาม",
        value: truncate(question)
      },
      {
        name: "คำตอบ",
        value: truncate(result.faq.answer)
      },
      {
        name: "หมวดหมู่",
        value: truncate(result.faq.category, 256)
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
        value: "สูง"
      }
    );
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
