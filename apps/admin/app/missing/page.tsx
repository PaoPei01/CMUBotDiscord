import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

const reasonLabels = {
  low_confidence: "Low confidence",
  negative_feedback: "Negative feedback",
  unanswered: "Unanswered"
};

const actionLabels = {
  add_alias: "Add alias",
  add_faq: "Add FAQ",
  add_keyword: "Add keyword",
  review_faq: "Review FAQ"
};

export default async function MissingPage() {
  requireAdmin();

  const reviewItems = await getAdminDatabase().listQuestionReviewItems();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Question review</h1>
          <p className="muted">
            Review unanswered questions, low-confidence matches, and negative feedback.
          </p>
        </div>
      </div>
      <div className="panel">
        {reviewItems.length === 0 ? (
          <p className="muted">No review items found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reason</th>
                <th>Question</th>
                <th>Matched FAQ</th>
                <th>Confidence</th>
                <th>Method</th>
                <th>Suggested action</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {reviewItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={`status status-${item.reason.replace("_", "-")}`}>
                      {reasonLabels[item.reason]}
                    </span>
                  </td>
                  <td>{item.user_question}</td>
                  <td>{item.matched_faq?.question ?? "-"}</td>
                  <td>{item.confidence ?? "-"}</td>
                  <td>{item.method ?? "-"}</td>
                  <td>{actionLabels[item.suggested_action]}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
