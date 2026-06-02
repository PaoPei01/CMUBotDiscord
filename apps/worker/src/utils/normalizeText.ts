export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

export function normalizeSearchText(value: string): string {
  return normalizeWhitespace(value.normalize("NFC").replace(/[\u200B-\u200D\uFEFF]/gu, ""))
    .toLocaleLowerCase("en-US");
}
