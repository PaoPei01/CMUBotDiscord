import type { KnowledgeSearchResult } from "../services/knowledgeSearch.js";
import type { DiscordEmbed, DiscordEmbedField } from "./types.js";

const EXPIRED_WARNING =
  "ข้อมูลนี้อาจพ้นช่วงเวลาที่กำหนดแล้ว กรุณาตรวจสอบประกาศล่าสุดจากแหล่งข้อมูลโดยตรง";

function truncate(value: string, maxLength = 1024): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
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

function formatAnswerText(answer: string): string {
  const trimmedAnswer = answer.trim();

  if (!trimmedAnswer) {
    return "";
  }

  const politeAnswer = /(?:ครับ|ค่ะ|คะ|นะครับ|นะคะ)$/u.test(trimmedAnswer)
    ? trimmedAnswer
    : `${trimmedAnswer} ครับ`;

  return `${politeAnswer}\n\nหากข้อมูลนี้ไม่ตรงกับประกาศล่าสุด สามารถกดปุ่ม feedback ด้านล่างเพื่อให้ทีมตรวจสอบต่อได้ครับ`;
}

export function formatAnswerEmbed({
  answer,
  result,
  sourceNames
}: {
  answer: string;
  result: KnowledgeSearchResult;
  sourceNames?: string[];
}): DiscordEmbed {
  const sourceName = sourceNames?.[0] ?? result.sourceName ?? "ไม่ระบุแหล่งข้อมูล";
  const sourceValue = result.sourceUrl
    ? `[${sourceName}](${result.sourceUrl})`
    : sourceName;
  const fields: DiscordEmbedField[] = [];

  if (result.category || result.audience || result.facultyGroup) {
    const scope = [
      result.category ? `หมวดหมู่: ${result.category}` : null,
      result.audience ? `สำหรับ: ${result.audience}` : null,
      result.facultyGroup ? `คณะ/กลุ่ม: ${result.facultyGroup}` : null
    ].filter(Boolean);

    fields.push({
      name: "ข้อมูลที่เกี่ยวข้อง",
      value: truncate(scope.join("\n"))
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
      value: formatDate(result.lastVerifiedAt)
    }
  );

  if (isExpired(result.validUntil)) {
    fields.push({
      name: "คำเตือน",
      value: EXPIRED_WARNING
    });
  }

  return {
    color: 0x1f8b4c,
    description: truncate(formatAnswerText(answer), 4096),
    fields,
    title: "คำตอบ"
  };
}
