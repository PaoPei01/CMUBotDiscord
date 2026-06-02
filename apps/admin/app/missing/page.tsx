import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

export default async function MissingPage() {
  requireAdmin();

  const logs = await getAdminDatabase().listMissingQuestions();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Missing answers</h1>
          <p className="muted">Questions where no verified FAQ was matched.</p>
        </div>
      </div>
      <div className="panel">
        {logs.length === 0 ? (
          <p className="muted">No unanswered questions found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Method</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user_question}</td>
                  <td>{log.method ?? "-"}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
