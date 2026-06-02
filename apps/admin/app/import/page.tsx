import { requireAdmin } from "../lib/auth";
import { importKnowledgeAction } from "./actions";

export default function ImportPage() {
  requireAdmin();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Import Knowledge</h1>
          <p className="muted">Create draft FAQs from supported files or URLs.</p>
        </div>
      </div>
      <form action={importKnowledgeAction} className="panel form-grid">
        <label className="field field-full">
          URL
          <input name="url" placeholder="https://example.edu/admissions" type="url" />
        </label>
        <label className="field field-full">
          File
          <input
            accept=".pdf,.docx,.txt,.md,.markdown"
            name="file"
            type="file"
          />
        </label>
        <label className="field">
          Chunk size words
          <input defaultValue="1000" min="100" name="chunkSizeWords" type="number" />
        </label>
        <label className="field">
          Overlap words
          <input defaultValue="150" min="0" name="overlapWords" type="number" />
        </label>
        <div className="actions field-full">
          <button className="button" type="submit">
            Generate Draft FAQs
          </button>
        </div>
      </form>
    </main>
  );
}
