import { faqCsvHeaders } from "./types.js";
import type { ParsedFaqCsv, RawFaqCsvRow } from "./types.js";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);
  return rows.filter((candidate) => candidate.some((value) => value.trim().length > 0));
}

export function normalizeImportText(value: string): string {
  return value
    .replace(/\[cite:\s*\d+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitCsvList(value: string): string[] {
  return normalizeImportText(value)
    .split(",")
    .map((item) => normalizeImportText(item))
    .filter(Boolean);
}

export function parseFaqCsv(csvText: string): ParsedFaqCsv {
  const parsedRows = parseCsv(csvText);
  const [headers, ...dataRows] = parsedRows;

  if (!headers) {
    return {
      errors: [
        {
          error: "CSV file is empty",
          faqId: null,
          field: "headers",
          rowNumber: 1
        }
      ],
      rows: []
    };
  }

  const normalizedHeaders = headers.map((header) => header.trim());
  const missingOrMismatchedHeaders = faqCsvHeaders.filter(
    (header, index) => normalizedHeaders[index] !== header
  );

  if (
    headers.length !== faqCsvHeaders.length ||
    missingOrMismatchedHeaders.length > 0
  ) {
    return {
      errors: [
        {
          error: `CSV headers must exactly match: ${faqCsvHeaders.join(", ")}`,
          faqId: null,
          field: "headers",
          rowNumber: 1
        }
      ],
      rows: []
    };
  }

  return {
    errors: [],
    rows: dataRows.map((values, rowIndex) => {
      const raw = Object.fromEntries(
        faqCsvHeaders.map((header, columnIndex) => [
          header,
          normalizeImportText(values[columnIndex] ?? "")
        ])
      ) as RawFaqCsvRow;

      return {
        raw,
        rowNumber: rowIndex + 2
      };
    })
  };
}
