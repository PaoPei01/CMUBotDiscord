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
const EXPIRED_WARNING =
  "ข้อมูลนี้อาจพ้นช่วงเวลาที่กำหนดแล้ว กรุณาตรวจสอบประกาศล่าสุดจากแหล่งข้อมูลโดยตรง";

type ButtonRow = ActionRowBuilder<ButtonBuilder>;

function truncate(value: string, maxLength = 1024): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function valueOrDash(value: string | null | undefined): string {
  return value?.trim() ? value : "-";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function isExpired(validUntil: string | null): boolean {
  return validUntil ? new Date(validUntil).getTime() < Date.now() : false;
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

function statusValue(result: SearchResult): string {
  const validity = [
    result.validFrom ? `เริ่มใช้: ${formatDate(result.validFrom)}` : null,
    result.validUntil ? `ใช้ถึง: ${formatDate(result.validUntil)}` : null
  ].filter(Boolean);
  return [
    `สถานะ: ${valueOrDash(result.status)}`,
    `ความสำคัญ: ${valueOrDash(result.priority)}`,
    validity.length > 0 ? validity.join("\n") : "ช่วงเวลา: -",
    `ความมั่นใจ: ${result.confidence}`
  ].join("\n");
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
  const sourceValue = sourceUrl ? `[${sourceName}](${sourceUrl})` : sourceName;
  const answer = result.answerShort ?? result.answer ?? NOT_FOUND_MESSAGE;
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
      value: truncate(answer)
    },
    {
      name: "หมวดหมู่",
      value: valueOrDash(result.category)
    },
    {
      name: "สำหรับ",
      value: valueOrDash(result.audience)
    }
  );

  if (result.facultyGroup) {
    fields.push({
      name: "คณะ/กลุ่ม",
      value: truncate(result.facultyGroup)
    });
  }

  fields.push(
    {
      name: "แหล่งข้อมูล",
      value: truncate(sourceValue)
    }
  );

  if (result.sourcePage) {
    fields.push({
      name: "หน้า/หัวข้ออ้างอิง",
      value: truncate(result.sourcePage)
    });
  }

  fields.push(
    {
      name: "ตรวจสอบล่าสุด",
      value: formatDate(result.source?.lastVerifiedAt)
    },
    {
      name: "สถานะข้อมูล",
      value: truncate(statusValue(result))
    }
  );

  if (isExpired(result.validUntil)) {
    fields.push({
      name: "คำเตือน",
      value: EXPIRED_WARNING
    });
  }

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
