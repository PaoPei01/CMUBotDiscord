import Link from "next/link";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatResponseTime(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return `${formatNumber(value)} ms`;
}

function formatSince(value: string): string {
  return new Date(value).toLocaleString();
}

export default async function InsightsPage() {
  requireAdmin();

  const insights = await getAdminDatabase().getQaInsights();
  const metrics = [
    { label: "Total questions", value: formatNumber(insights.totalQuestions) },
    { label: "Answered", value: formatNumber(insights.answeredQuestions) },
    { label: "Not found", value: formatNumber(insights.notFoundQuestions) },
    { label: "Low confidence", value: formatNumber(insights.lowConfidenceQuestions) },
    { label: "Feedback up", value: formatNumber(insights.feedbackUpCount) },
    { label: "Feedback down", value: formatNumber(insights.feedbackDownCount) },
    { label: "Avg response time", value: formatResponseTime(insights.averageResponseTimeMs) }
  ];

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Q&A Insights</h1>
          <p className="muted">
            Daily health overview from aggregate question logs and feedback for the last 7 days.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Health summary</h2>
            <p className="muted">Since {formatSince(insights.since)}</p>
          </div>
          <span className="header-chip">Aggregate only</span>
        </div>
        <div className="metric-grid">
          {metrics.map((metric) => (
            <div className="metric-card" key={metric.label}>
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel section-gap">
        <div className="section-heading">
          <div>
            <h2>Top unanswered questions</h2>
            <p className="muted">Grouped by normalized question text.</p>
          </div>
          <span className="header-chip">{insights.topUnansweredQuestions.length} rows</span>
        </div>
        {insights.topUnansweredQuestions.length === 0 ? (
          <p className="muted">No unanswered questions in this window.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {insights.topUnansweredQuestions.map((item) => (
                <tr key={item.question}>
                  <td>{item.question}</td>
                  <td>{formatNumber(item.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel section-gap">
        <div className="section-heading">
          <div>
            <h2>Top matched FAQs</h2>
            <p className="muted">Frequently matched verified FAQ records.</p>
          </div>
          <span className="header-chip">{insights.topMatchedFaqs.length} rows</span>
        </div>
        {insights.topMatchedFaqs.length === 0 ? (
          <p className="muted">No matched FAQs in this window.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>FAQ</th>
                <th>Matches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {insights.topMatchedFaqs.map((item) => (
                <tr key={item.faqId}>
                  <td>{item.question}</td>
                  <td>{formatNumber(item.count)}</td>
                  <td>
                    <Link className="button button-secondary" href={`/faq/${item.faqId}/edit`}>
                      Edit FAQ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel section-gap">
        <div className="section-heading">
          <div>
            <h2>Most down-voted FAQs</h2>
            <p className="muted">Feedback down counts tied back to matched FAQ records.</p>
          </div>
          <span className="header-chip">{insights.mostDownVotedFaqs.length} rows</span>
        </div>
        {insights.mostDownVotedFaqs.length === 0 ? (
          <p className="muted">No down-voted FAQs in this window.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>FAQ</th>
                <th>Down votes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {insights.mostDownVotedFaqs.map((item) => (
                <tr key={item.faqId}>
                  <td>{item.question}</td>
                  <td>{formatNumber(item.downVotes)}</td>
                  <td>
                    <Link className="button button-secondary" href={`/faq/${item.faqId}/edit`}>
                      Edit FAQ
                    </Link>
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
