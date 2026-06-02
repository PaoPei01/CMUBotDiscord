import Link from "next/link";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";
import { bulkApproveDraftsAction, bulkRejectDraftsAction } from "./actions";

export default async function DraftsPage({
  searchParams
}: {
  searchParams: { status?: string; success?: string; count?: string };
}) {
  requireAdmin();

  const status =
    searchParams.status === "approved" ||
    searchParams.status === "rejected" ||
    searchParams.status === "duplicate" ||
    searchParams.status === "pending"
      ? searchParams.status
      : undefined;
  const database = getAdminDatabase();
  const drafts = await database.listDrafts(status);

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Draft FAQs</h1>
          <p className="muted">AI-generated entries wait here until admin review.</p>
        </div>
        <Link className="button button-secondary" href="/import">
          Import
        </Link>
      </div>
      {searchParams.success ? (
        <div className="message message-success">
          {searchParams.success} {searchParams.count ? `(${searchParams.count})` : ""}
        </div>
      ) : null}
      <form className="panel" action={bulkApproveDraftsAction}>
        <div className="actions">
          <button className="button" type="submit">
            Bulk approve
          </button>
          <button
            className="button button-secondary"
            formAction={bulkRejectDraftsAction}
            type="submit"
          >
            Bulk reject
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Question</th>
              <th>Category</th>
              <th>Status</th>
              <th>Source</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft.id}>
                <td>
                  <input
                    disabled={draft.status !== "pending"}
                    name="draftId"
                    type="checkbox"
                    value={draft.id}
                  />
                </td>
                <td>
                  <Link href={`/drafts/${draft.id}`}>{draft.question}</Link>
                  {draft.duplicate_confidence ? (
                    <div className="muted">duplicate {draft.duplicate_confidence}%</div>
                  ) : null}
                </td>
                <td>{draft.category}</td>
                <td>
                  <span className={`status status-${draft.status}`}>{draft.status}</span>
                </td>
                <td>{draft.knowledge_source.name}</td>
                <td>{draft.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
    </main>
  );
}
