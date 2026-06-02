import { FaqForm } from "../../components/FaqForm";
import { createFaqAction } from "../actions";
import { requireAdmin } from "../../lib/auth";

export default function NewFAQPage() {
  requireAdmin();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Create FAQ</h1>
          <p className="muted">Add a verified answer with source citation metadata.</p>
        </div>
      </div>
      <FaqForm action={createFaqAction} submitLabel="Create FAQ" />
    </main>
  );
}
