"use client";

import { useState } from "react";
import type { FAQImportResult } from "@campus-qa/database";

type CsvImportFormProps = {
  requiredHeaders: string[];
};

type ImportResponse =
  | {
      result: FAQImportResult;
    }
  | {
      error: string;
    };

type SummaryKey = Exclude<keyof FAQImportResult, "dryRun" | "validationErrors">;

const summaryLabels: Array<[SummaryKey, string]> = [
  ["totalRows", "Total rows"],
  ["createdFaqs", "Created FAQs"],
  ["updatedFaqs", "Updated FAQs"],
  ["skippedRows", "Skipped rows"],
  ["createdSources", "Created sources"],
  ["updatedSources", "Updated sources"],
  ["aliasesImported", "Aliases"],
  ["keywordsImported", "Keywords"],
  ["relatedFaqLinksImported", "Related links"]
];

async function postCsv(endpoint: string, file: File): Promise<FAQImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    body: formData,
    method: "POST"
  });
  const payload = (await response.json()) as ImportResponse;

  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error : "CSV import request failed");
  }

  return payload.result;
}

function SummaryTable({ result }: { result: FAQImportResult }) {
  return (
    <table>
      <tbody>
        {summaryLabels.map(([key, label]) => (
          <tr key={key}>
            <th>{label}</th>
            <td>{result[key]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ValidationErrors({ result }: { result: FAQImportResult }) {
  if (result.validationErrors.length === 0) {
    return <p className="message message-success">No validation errors found.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Row</th>
          <th>FAQ ID</th>
          <th>Field</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        {result.validationErrors.map((error) => (
          <tr key={`${error.rowNumber}-${error.field}-${error.error}`}>
            <td>{error.rowNumber}</td>
            <td>{error.faqId ?? "-"}</td>
            <td>{error.field}</td>
            <td>{error.error}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CsvImportForm({ requiredHeaders }: CsvImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<FAQImportResult | null>(null);
  const [commitResult, setCommitResult] = useState<FAQImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"commit" | "dry-run" | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function runImport(mode: "commit" | "dry-run") {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setError(null);
    setLoading(mode);

    try {
      const result = await postCsv(
        mode === "dry-run" ? "/api/import/faqs/dry-run" : "/api/import/faqs/commit",
        file
      );

      if (mode === "dry-run") {
        setDryRunResult(result);
        setCommitResult(null);
        setConfirmed(false);
      } else {
        setCommitResult(result);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Import failed");
    } finally {
      setLoading(null);
    }
  }

  const canCommit =
    dryRunResult !== null &&
    dryRunResult.validationErrors.length === 0 &&
    confirmed &&
    loading === null;

  function updateSelectedFile(event: React.ChangeEvent<HTMLInputElement>): void {
    const target = event.currentTarget as unknown as {
      files?: ArrayLike<File> | null;
    };
    setFile(target.files?.[0] ?? null);
    setDryRunResult(null);
    setCommitResult(null);
    setConfirmed(false);
  }

  function updateConfirmed(event: React.ChangeEvent<HTMLInputElement>): void {
    const target = event.currentTarget as unknown as {
      checked?: boolean;
    };
    setConfirmed(Boolean(target.checked));
  }

  return (
    <>
      <section className="panel section-gap">
        <h2>Required CSV headers</h2>
        <div className="header-list">
          {requiredHeaders.map((header) => (
            <span className="header-chip" key={header}>
              {header}
            </span>
          ))}
        </div>
      </section>

      <section className="panel section-gap">
        <label className="field">
          CSV file
          <input accept=".csv,text/csv" onChange={updateSelectedFile} type="file" />
        </label>
        <label className="field field-full">
          <input
            checked={confirmed}
            disabled={!dryRunResult || dryRunResult.validationErrors.length > 0}
            onChange={updateConfirmed}
            type="checkbox"
          />
          I reviewed the dry-run summary and want to import this CSV into production FAQ tables.
        </label>
        <div className="actions">
          <button
            className="button button-secondary"
            disabled={loading !== null}
            onClick={() => void runImport("dry-run")}
            type="button"
          >
            {loading === "dry-run" ? "Validating..." : "Dry-run preview"}
          </button>
          <button
            className="button"
            disabled={!canCommit}
            onClick={() => void runImport("commit")}
            type="button"
          >
            {loading === "commit" ? "Importing..." : "Confirm import"}
          </button>
        </div>
        {error ? <p className="message message-error">{error}</p> : null}
        {!canCommit && dryRunResult ? (
          <p className="muted">Fix validation errors before confirming import.</p>
        ) : null}
      </section>

      {dryRunResult ? (
        <section className="panel section-gap">
          <h2>Dry-run preview</h2>
          <SummaryTable result={dryRunResult} />
          <div className="section-gap">
            <h3>Validation errors</h3>
            <ValidationErrors result={dryRunResult} />
          </div>
        </section>
      ) : null}

      {commitResult ? (
        <section className="panel section-gap">
          <h2>Import summary</h2>
          <p className="message message-success">CSV import completed.</p>
          <SummaryTable result={commitResult} />
        </section>
      ) : null}
    </>
  );
}
