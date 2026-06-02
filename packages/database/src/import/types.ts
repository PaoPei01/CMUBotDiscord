import type { FAQImportError, FAQImportResult, FAQImportRow } from "../types.js";

export const faqCsvHeaders = [
  "FAQ ID",
  "Status",
  "Category",
  "Audience",
  "Faculty / Group",
  "Question",
  "Aliases",
  "Keywords",
  "Answer Short",
  "Answer Full",
  "Source Name",
  "Source URL",
  "Source Page",
  "Source Quote",
  "Last Verified",
  "Valid From",
  "Valid Until",
  "Priority",
  "Related FAQ IDs"
] as const;

export type RawFaqCsvRow = Record<(typeof faqCsvHeaders)[number], string>;

export type ParsedFaqCsv = {
  errors: FAQImportError[];
  rows: Array<{
    raw: RawFaqCsvRow;
    rowNumber: number;
  }>;
};

export type ValidatedFaqImportRow = FAQImportRow & {
  rowNumber: number;
};

export type FaqImportInput = {
  csvText: string;
  dryRun: boolean;
  serviceRoleKey: string;
  supabaseUrl: string;
};

export type { FAQImportError, FAQImportResult, FAQImportRow };
