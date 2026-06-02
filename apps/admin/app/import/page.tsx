import { faqCsvHeaders } from "@campus-qa/database";

import { requireAdmin } from "../lib/auth";
import { CsvImportForm } from "./CsvImportForm";
import { SourceImportForm } from "./SourceImportForm";

export default function ImportPage() {
  requireAdmin();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Import</h1>
          <p className="muted">Create draft FAQs from sources or import prepared verified FAQ rows.</p>
        </div>
      </div>

      <section className="section-gap">
        <div className="section-heading">
          <div>
            <h2>AI Source Import</h2>
            <p className="muted">Upload a source or provide a URL to generate draft FAQs for review.</p>
          </div>
        </div>
        <SourceImportForm />
      </section>

      <section className="section-gap">
        <div className="section-heading">
          <div>
            <h2>FAQ CSV Import</h2>
            <p className="muted">Upload prepared verified FAQ rows into Supabase.</p>
          </div>
        </div>
        <CsvImportForm requiredHeaders={[...faqCsvHeaders]} />
      </section>
    </main>
  );
}
