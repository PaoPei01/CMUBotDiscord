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
  "alias-added": "Alias saved or already existed; review item marked reviewed.",
  "keyword-added": "Keyword saved or already existed; review item marked reviewed.",
  linked: "Question linked to FAQ and marked reviewed.",
  reviewed: "Review item marked reviewed."
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function suggestedKeyword(question: string): string {
  const normalized = question.trim().replace(/\s+/gu, " ");
  const words = normalized.split(" ").filter((word) => word.length >= 2);

  if (words.length === 0) {
    return normalized.length <= 40 ? normalized : "";
  }

  return words
    .sort((left, right) => right.length - left.length)
    .slice(0, 3)
    .join(" ")
    .slice(0, 80);
}

export default async function ReviewsPage({
  searchParams
}: {
  searchParams?: { error?: string; success?: string };
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
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;

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
      {error ? <div className="message message-error">{error}</div> : null}
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
                        <button className="button button-secondary" type="submit">
                          Link
                        </button>
                      </form>
                      <form action={addAliasFromQuestionAction} className="review-link-form">
                        <input
                          name="questionLogId"
                          type="hidden"
                          value={item.question_log_id}
                        />
                        <select
                          aria-label="FAQ for alias"
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
                        <label>
                          Alias
                          <input
                            maxLength={200}
                            minLength={2}
                            name="alias"
                            required
                            type="text"
                            defaultValue={item.user_question}
                          />
                        </label>
                        <button className="button button-secondary" type="submit">
                          Save alias
                        </button>
                      </form>
                      <form action={addKeywordFromQuestionAction} className="review-link-form">
                        <input
                          name="questionLogId"
                          type="hidden"
                          value={item.question_log_id}
                        />
                        <select
                          aria-label="FAQ for keyword"
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
                        <label>
                          Keyword
                          <input
                            maxLength={200}
                            minLength={2}
                            name="keyword"
                            placeholder="Short keyword"
                            required
                            type="text"
                            defaultValue={suggestedKeyword(item.user_question)}
                          />
                        </label>
                        <button className="button button-secondary" type="submit">
                          Save keyword
                        </button>
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
