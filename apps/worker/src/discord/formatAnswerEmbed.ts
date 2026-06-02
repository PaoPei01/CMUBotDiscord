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

function statusValue(result: KnowledgeSearchResult): string {
  const validity = [
    result.validFrom ? `เริ่มใช้: ${formatDate(result.validFrom)}` : null,
    result.validUntil ? `ใช้ถึง: ${formatDate(result.validUntil)}` : null
  ].filter(Boolean);
  return [
    "สถานะ: active",
    `ความสำคัญ: ${valueOrDash(result.priority)}`,
    validity.length > 0 ? validity.join("\n") : "ช่วงเวลา: -",
    `ความมั่นใจ: ${result.confidence}`
  ].join("\n");
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

  return {
    color: 0x1f8b4c,
    fields,
    title: "คำตอบจากฐานข้อมูล"
  };
}
