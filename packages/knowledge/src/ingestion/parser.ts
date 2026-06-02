import { createHash } from "node:crypto";
import { createRequire } from "node:module";

import type { ParsedKnowledgeInput, SupportedKnowledgeInput } from "./types.js";

const supportedExtensions = new Map<string, SupportedKnowledgeInput>([
  [".pdf", "pdf"],
  [".docx", "docx"],
  [".txt", "txt"],
  [".md", "markdown"],
  [".markdown", "markdown"]
]);

type PdfParse = (buffer: Buffer) => Promise<{ text: string }>;

function isPdfParse(value: unknown): value is PdfParse {
  return typeof value === "function";
}

export type ParseFileInput = {
  contentType?: string;
  fileName: string;
  maxBytes: number;
  bytes: Uint8Array;
};

export function detectInputType(fileName: string): SupportedKnowledgeInput | null {
  const normalized = fileName.trim().toLowerCase();
  const extension = [...supportedExtensions.keys()].find((candidate) =>
    normalized.endsWith(candidate)
  );

  return extension ? supportedExtensions.get(extension)! : null;
}

export function contentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function validateFileInput(input: ParseFileInput): SupportedKnowledgeInput {
  const sourceType = detectInputType(input.fileName);

  if (!sourceType) {
    throw new Error("Unsupported knowledge file type");
  }

  if (input.bytes.byteLength === 0) {
    throw new Error("Knowledge file is empty");
  }

  if (input.bytes.byteLength > input.maxBytes) {
    throw new Error("Knowledge file exceeds configured size limit");
  }

  return sourceType;
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ");
}

export function normalizeParsedText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

async function parsePdf(bytes: Uint8Array): Promise<string> {
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse") as unknown;

  if (!isPdfParse(pdfParse)) {
    throw new Error("PDF parser is not available");
  }

  const result = await pdfParse(Buffer.from(bytes));
  return result.text;
}

async function parseDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return result.value;
}

export async function parseKnowledgeFile(
  input: ParseFileInput
): Promise<ParsedKnowledgeInput & { contentHash: string; mimeType: string | null }> {
  const sourceType = validateFileInput(input);
  let content = "";

  if (sourceType === "txt" || sourceType === "markdown") {
    content = new TextDecoder("utf-8").decode(input.bytes);
  } else if (sourceType === "pdf") {
    content = await parsePdf(input.bytes);
  } else {
    content = await parseDocx(input.bytes);
  }

  return {
    content: normalizeParsedText(content),
    contentHash: contentHash(input.bytes),
    mimeType: input.contentType ?? null,
    name: input.fileName,
    sourceType,
    url: null
  };
}

export async function parseKnowledgeUrl(url: string): Promise<ParsedKnowledgeInput> {
  const parsed = new URL(url);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const response = await fetch(parsed.toString());

  if (!response.ok) {
    throw new Error(`URL fetch failed with status ${response.status}`);
  }

  const html = await response.text();

  return {
    content: normalizeParsedText(stripHtml(html)),
    name: parsed.hostname,
    sourceType: "url",
    url: parsed.toString()
  };
}
