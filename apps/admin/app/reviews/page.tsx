import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

export default async function ReviewsPage() {
  requireAdmin();

  const database = getAdminDatabase();
  const [reviews, logs] = await Promise.all([
    database.listReviews(),
    database.listImportLogs()
  ]);

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Knowledge Reviews</h1>
          <p className="muted">Review actions and import logs for draft FAQs.</p>
        </div>
      </div>
      <section className="panel">
        <h2>Review actions</h2>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Draft</th>
              <th>Production FAQ</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.action}</td>
                <td>{review.draft_faq?.question ?? review.draft_faq_id ?? "n/a"}</td>
                <td>{review.production_faq_id ?? "n/a"}</td>
                <td>{review.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel section-gap">
        <h2>Import logs</h2>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Message</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.action}</td>
                <td>{log.message}</td>
                <td>{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
