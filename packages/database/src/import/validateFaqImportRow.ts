import type { FAQPriority, FAQStatus } from "../types.js";
import { splitCsvList } from "./parseFaqCsv.js";
import type {
  FAQImportError,
  RawFaqCsvRow,
  ValidatedFaqImportRow
} from "./types.js";

const validStatuses = new Set<FAQStatus>([
  "active",
  "draft",
  "expired",
  "inactive"
]);
const validPriorities = new Set<FAQPriority>(["high", "medium", "low"]);

function error(
  rowNumber: number,
  faqId: string | null,
  field: string,
  message: string
): FAQImportError {
  return {
    error: message,
    faqId,
    field,
    rowNumber
  };
}

function required(
  errors: FAQImportError[],
  row: RawFaqCsvRow,
  rowNumber: number,
  faqId: string | null,
  field: keyof RawFaqCsvRow
): void {
  if (!row[field]) {
    errors.push(error(rowNumber, faqId, field, `${field} is required`));
  }
}

function optionalDate(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function validateDate(
  errors: FAQImportError[],
  value: string,
  rowNumber: number,
  faqId: string | null,
  field: keyof RawFaqCsvRow,
  requiredField = false
): string | null {
  if (!value && !requiredField) {
    return null;
  }

  const parsed = optionalDate(value);

  if (!parsed) {
    errors.push(error(rowNumber, faqId, field, `${field} must be a valid date`));
    return null;
  }

  return parsed;
}

function validateUrl(
  errors: FAQImportError[],
  value: string,
  rowNumber: number,
  faqId: string | null
): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    errors.push(error(rowNumber, faqId, "Source URL", "Source URL must be a valid URL"));
    return null;
  }
}

export function validateFaqImportRow(
  raw: RawFaqCsvRow,
  rowNumber: number
): {
  errors: FAQImportError[];
  row: ValidatedFaqImportRow | null;
} {
  const errors: FAQImportError[] = [];
  const faqId = raw["FAQ ID"] || null;

  required(errors, raw, rowNumber, faqId, "FAQ ID");
  required(errors, raw, rowNumber, faqId, "Status");
  required(errors, raw, rowNumber, faqId, "Category");
  required(errors, raw, rowNumber, faqId, "Question");
  required(errors, raw, rowNumber, faqId, "Answer Short");
  required(errors, raw, rowNumber, faqId, "Source Name");
  required(errors, raw, rowNumber, faqId, "Last Verified");

  const status = raw.Status as FAQStatus;
  if (raw.Status && !validStatuses.has(status)) {
    errors.push(
      error(
        rowNumber,
        faqId,
        "Status",
        "Status must be active, draft, expired, or inactive"
      )
    );
  }

  const priority = (raw.Priority || "medium") as FAQPriority;
  if (!validPriorities.has(priority)) {
    errors.push(error(rowNumber, faqId, "Priority", "Priority must be high, medium, or low"));
  }

  const sourceUrl = validateUrl(errors, raw["Source URL"], rowNumber, faqId);
  const lastVerified = validateDate(
    errors,
    raw["Last Verified"],
    rowNumber,
    faqId,
    "Last Verified",
    true
  );
  const validFrom = validateDate(errors, raw["Valid From"], rowNumber, faqId, "Valid From");
  const validUntil = validateDate(
    errors,
    raw["Valid Until"],
    rowNumber,
    faqId,
    "Valid Until"
  );

  if (errors.length > 0 || !faqId || !lastVerified) {
    return {
      errors,
      row: null
    };
  }

  return {
    errors,
    row: {
      aliases: splitCsvList(raw.Aliases),
      answerFull: raw["Answer Full"] || null,
      answerShort: raw["Answer Short"],
      audience: raw.Audience || null,
      category: raw.Category,
      facultyGroup: raw["Faculty / Group"] || null,
      faqId,
      keywords: splitCsvList(raw.Keywords),
      lastVerified,
      priority,
      question: raw.Question,
      relatedFaqIds: splitCsvList(raw["Related FAQ IDs"]),
      rowNumber,
      sourceName: raw["Source Name"],
      sourcePage: raw["Source Page"] || null,
      sourceQuote: raw["Source Quote"] || null,
      sourceUrl,
      status,
      validFrom,
      validUntil
    }
  };
}
