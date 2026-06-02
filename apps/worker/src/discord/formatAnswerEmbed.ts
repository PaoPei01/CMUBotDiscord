import type { KnowledgeSearchResult } from "../services/knowledgeSearch.js";
import type { DiscordEmbed } from "./types.js";

const EXPIRED_WARNING =
  "ข้อมูลนี้อาจพ้นช่วงเวลาที่กำหนดแล้ว กรุณาตรวจสอบประกาศล่าสุดจากแหล่งข้อมูลโดยตรง";

function truncate(value: string, maxLength = 1024): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function valueOrDash(value: string | null | undefined): string {
  return value?.trim() ? value : "-";
}

function isExpired(validUntil: string | null): boolean {
  return validUntil ? new Date(validUntil).getTime() < Date.now() : false;
}

export function formatAnswerEmbed({
  answer,
  question,
  result,
  sourceNames
}: {
  answer: string;
  question: string;
  result: KnowledgeSearchResult;
  sourceNames?: string[];
}): DiscordEmbed {
  const sourceName = sourceNames?.[0] ?? result.sourceName ?? "ไม่ระบุแหล่งข้อมูล";
  const sourceValue = result.sourceUrl
    ? `[${sourceName}](${result.sourceUrl})`
    : sourceName;
  const fields = [
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
  ];

  if (result.facultyGroup) {
    fields.push({
      name: "คณะ/กลุ่ม",
      value: result.facultyGroup
    });
  }

  fields.push(
    {
      name: "แหล่งข้อมูล",
      value: truncate(sourceValue)
    },
    {
      name: "หน้า/หัวข้ออ้างอิง",
      value: valueOrDash(result.sourcePage)
    },
    {
      name: "ตรวจสอบล่าสุด",
      value: valueOrDash(result.lastVerifiedAt)
    },
    {
      name: "ความมั่นใจ",
      value: String(result.confidence)
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
    fields,
    title: "คำตอบจากฐานข้อมูล"
  };
}
