import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";
import {
  addAliasFromQuestionAction,
  addKeywordFromQuestionAction,
  createDraftFromReviewAction,
  linkQuestionToFaqAction,
  markReviewedAction
} from "./actions";

const reasonLabels = {
  low_confidence: "Low confidence",
  negative_feedback: "Feedback down",
  unanswered: "Unanswered"
};

const successMessages: Record<string, string> = {
  "alias-added": "Alias added and review item marked reviewed.",
  "keyword-added": "Keyword added and review item marked reviewed.",
  linked: "Question linked to FAQ and marked reviewed.",
  reviewed: "Review item marked reviewed."
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default async function ReviewsPage({
  searchParams
}: {
  searchParams?: { success?: string };
}) {
  requireAdmin();

  const database = getAdminDatabase();
  const [reviewItems, faqs, reviews, logs] = await Promise.all([
    database.listQuestionReviewItems(),
    database.listFaqs({ status: "active" }),
    database.listReviews(),
    database.listImportLogs()
  ]);
  const success = searchParams?.success ? successMessages[searchParams.success] : null;

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Admin Review Queue</h1>
          <p className="muted">
            Triage unanswered questions, low-confidence matches, and down-voted answers.
          </p>
        </div>
      </div>
      {success ? <div className="message message-success">{success}</div> : null}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Question review queue</h2>
            <p className="muted">Actions never publish new FAQ records directly.</p>
          </div>
          <span className="header-chip">{reviewItems.length} open</span>
        </div>
        {reviewItems.length === 0 ? (
          <p className="muted">No open review items.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reason</th>
                <th>Question</th>
                <th>Matched FAQ</th>
                <th>Confidence</th>
                <th>Method</th>
                <th>Guild</th>
                <th>Created</th>
                <th>Actions</th>
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
                  <td>{item.discord_guild_id ?? "-"}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <div className="review-actions">
                      <form action={markReviewedAction}>
                        <input
                          name="questionLogId"
                          type="hidden"
                          value={item.question_log_id}
                        />
                        <button className="button button-secondary" type="submit">
                          Mark reviewed
                        </button>
                      </form>
                      <form action={createDraftFromReviewAction}>
                        <input
                          name="questionLogId"
                          type="hidden"
                          value={item.question_log_id}
                        />
                        <button className="button" type="submit">
                          Create draft
                        </button>
                      </form>
                      <form action={linkQuestionToFaqAction} className="review-link-form">
                        <input
                          name="questionLogId"
                          type="hidden"
                          value={item.question_log_id}
                        />
                        <select
                          aria-label="Existing FAQ"
                          defaultValue={item.matched_faq?.id ?? ""}
                          name="faqId"
                          required
                        >
                          <option value="">Select FAQ</option>
                          {faqs.map((faq) => (
                            <option key={faq.id} value={faq.id}>
                              {faq.question}
                            </option>
                          ))}
                        </select>
                        <div className="review-inline-buttons">
                          <button className="button button-secondary" type="submit">
                            Link
                          </button>
                          <button
                            className="button button-secondary"
                            formAction={addAliasFromQuestionAction}
                            type="submit"
                          >
                            Add alias
                          </button>
                          <button
                            className="button button-secondary"
                            formAction={addKeywordFromQuestionAction}
                            type="submit"
                          >
                            Add keyword
                          </button>
                        </div>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="panel section-gap">
        <h2>Draft review history</h2>
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
