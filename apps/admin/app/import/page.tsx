import { faqCsvHeaders } from "@campus-qa/database";

import { requireAdmin } from "../lib/auth";
import { CsvImportForm } from "./CsvImportForm";

export default function ImportPage() {
  requireAdmin();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>FAQ CSV Import</h1>
          <p className="muted">Upload prepared verified FAQ rows into Supabase.</p>
        </div>
      </div>
      <CsvImportForm requiredHeaders={[...faqCsvHeaders]} />
    </main>
  );
}
