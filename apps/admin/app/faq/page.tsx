import Link from "next/link";

import { requireAdmin } from "../lib/auth";
import { getAdminDatabase } from "../lib/database";

type FAQPageProps = {
  searchParams: {
    category?: string;
    q?: string;
    status?: "active" | "inactive";
  };
};

export default async function FAQPage({ searchParams }: FAQPageProps) {
  requireAdmin();

  const database = getAdminDatabase();
  const [faqs, categories] = await Promise.all([
    database.listFaqs({
      category: searchParams.category,
      query: searchParams.q,
      status: searchParams.status
    }),
    database.listCategories()
  ]);

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>FAQ list</h1>
          <p className="muted">Manage verified Q&A records served by the bot.</p>
        </div>
        <Link className="button" href="/faq/new">
          New FAQ
        </Link>
      </div>

      <form className="panel filters">
        <label className="field">
          Search FAQ
          <input defaultValue={searchParams.q} name="q" placeholder="Question or answer" />
        </label>
        <label className="field">
          Category
          <select defaultValue={searchParams.category ?? ""} name="category">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Status
          <select defaultValue={searchParams.status ?? ""} name="status">
            <option value="">All statuses</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <div className="actions">
          <button className="button" type="submit">
            Apply
          </button>
          <Link className="button button-secondary" href="/faq">
            Reset
          </Link>
        </div>
      </form>

      <div className="panel">
        {faqs.length === 0 ? (
          <p className="muted">No FAQs found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Question</th>
                <th>Status</th>
                <th>Source</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td>{faq.category}</td>
                  <td>{faq.question}</td>
                  <td>
                    <span className={`status status-${faq.status}`}>{faq.status}</span>
                  </td>
                  <td>
                    {faq.source?.url ? (
                      <a href={faq.source.url}>{faq.source.name}</a>
                    ) : (
                      faq.source?.name ?? "No source"
                    )}
                  </td>
                  <td>{new Date(faq.updated_at).toLocaleString()}</td>
                  <td>
                    <Link href={`/faq/${faq.id}/edit`}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
