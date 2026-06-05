import Link from "next/link";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";
import { markSourceReviewedAction } from "./actions";

const reasonLabels = {
  expired: "Expired",
  expiring_soon: "Expiring soon",
  stale_source: "Stale source"
};

const successMessages: Record<string, string> = {
  "source-reviewed": "Source review date updated."
};

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
}

export default async function FreshnessPage({
  searchParams
}: {
  searchParams?: { success?: string };
}) {
  requireAdmin();

  const items = await getAdminDatabase().listFreshnessItems();
  const success = searchParams?.success ? successMessages[searchParams.success] : null;

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Source Freshness</h1>
          <p className="muted">
            Find expired, expiring, and stale verified FAQ records before students see old data.
          </p>
        </div>
      </div>
      {success ? <div className="message message-success">{success}</div> : null}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Freshness queue</h2>
            <p className="muted">
              Rules: expired valid_until, valid_until within 30 days, or source older than 90 days.
            </p>
          </div>
          <span className="header-chip">{items.length} flagged</span>
        </div>
        {items.length === 0 ? (
          <p className="muted">No freshness issues found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reason</th>
                <th>Question</th>
                <th>Category</th>
                <th>Source</th>
                <th>Last verified</th>
                <th>Valid from</th>
                <th>Valid until</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="header-list">
                      {item.freshness_reasons.map((reason) => (
                        <span className={`status status-${reason.replace("_", "-")}`} key={reason}>
                          {reasonLabels[reason]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{item.question}</td>
                  <td>{item.category}</td>
                  <td>
                    {item.source?.url ? (
                      <a href={item.source.url}>{item.source.name}</a>
                    ) : (
                      item.source?.name ?? "No source"
                    )}
                  </td>
                  <td>{formatDate(item.source?.last_verified_at ?? null)}</td>
                  <td>{formatDate(item.valid_from)}</td>
                  <td>{formatDate(item.valid_until)}</td>
                  <td>
                    <span className={`status status-${item.status}`}>{item.status}</span>
                  </td>
                  <td>{item.priority}</td>
                  <td>
                    <div className="review-actions">
                      <Link className="button button-secondary" href={`/faq/${item.id}/edit`}>
                        Edit FAQ
                      </Link>
                      {item.source?.id ? (
                        <form action={markSourceReviewedAction}>
                          <input name="sourceId" type="hidden" value={item.source.id} />
                          <button className="button button-secondary" type="submit">
                            Mark source reviewed
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
