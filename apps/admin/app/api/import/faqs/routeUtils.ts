import { importFaqs } from "@campus-qa/database";
import type { FAQImportResult } from "@campus-qa/database";

import { isAdminAuthenticated } from "../../../lib/auth";

type ImportResponse =
  | {
      result: FAQImportResult;
    }
  | {
      error: string;
    };

function maxCsvImportBytes(): number {
  const configured = Number(process.env.FAQ_CSV_IMPORT_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0 ? configured : 2 * 1024 * 1024;
}

function jsonResponse(body: ImportResponse, status = 200): Response {
  return Response.json(body, { status });
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLocaleLowerCase("en-US");
  return name.endsWith(".csv") || file.type === "text/csv" || file.type === "application/vnd.ms-excel";
}

export async function handleFaqCsvImportRequest(
  request: Request,
  dryRun: boolean
): Promise<Response> {
  if (!isAdminAuthenticated()) {
    return jsonResponse({ error: "Admin authentication required" }, 401);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase service configuration is missing" }, 500);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonResponse({ error: "CSV file is required" }, 400);
  }

  if (!isCsvFile(file)) {
    return jsonResponse({ error: "Only CSV files are accepted" }, 400);
  }

  if (file.size > maxCsvImportBytes()) {
    return jsonResponse({ error: "CSV file is larger than the configured limit" }, 400);
  }

  const csvText = await file.text();
  const result = await importFaqs({
    csvText,
    dryRun,
    serviceRoleKey,
    supabaseUrl
  });

  return jsonResponse({ result });
}
