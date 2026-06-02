import { notFound } from "next/navigation";

import { requireAdmin } from "../../lib/auth";
import { getAdminDatabase } from "../../lib/database";
import {
  approveDraftAction,
  editDraftAction,
  rejectDraftAction
} from "../actions";

export default async function DraftDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { success?: string };
}) {
  requireAdmin();

  const database = getAdminDatabase();
  const draft = await database.getDraft(params.id);

  if (!draft) {
    notFound();
  }

  const editAction = editDraftAction.bind(null, draft.id);
  const approveAction = approveDraftAction.bind(null, draft.id);
  const rejectAction = rejectDraftAction.bind(null, draft.id);

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Review Draft</h1>
          <p className="muted">{draft.knowledge_source.name}</p>
        </div>
      </div>
      {searchParams.success ? (
        <div className="message message-success">{searchParams.success}</div>
      ) : null}
      <form action={editAction} className="panel form-grid">
        <label className="field">
          Category
          <input defaultValue={draft.category} name="category" required />
        </label>
        <label className="field">
          Confidence
          <input
            defaultValue={draft.confidence}
            max="100"
            min="0"
            name="confidence"
            type="number"
          />
        </label>
        <label className="field field-full">
          Question
          <input defaultValue={draft.question} name="question" required />
        </label>
        <label className="field field-full">
          Answer
          <textarea defaultValue={draft.answer} name="answer" required />
        </label>
        <label className="field field-full">
          Keywords
          <textarea
            defaultValue={draft.keywords.map((keyword) => keyword.keyword).join("\n")}
            name="keywords"
          />
        </label>
        <div className="field">
          <span className={`status status-${draft.status}`}>{draft.status}</span>
        </div>
        <div className="field">
          <span className="muted">
            Duplicate confidence: {draft.duplicate_confidence ?? 0}
          </span>
        </div>
        <div className="actions field-full">
          <button className="button button-secondary" type="submit">
            Save edit
          </button>
          <button
            className="button"
            disabled={draft.status !== "pending"}
            formAction={approveAction}
            type="submit"
          >
            Approve
          </button>
          <button
            className="button button-secondary"
            disabled={draft.status === "approved" || draft.status === "rejected"}
            formAction={rejectAction}
            type="submit"
          >
            Reject
          </button>
        </div>
      </form>
    </main>
  );
}
