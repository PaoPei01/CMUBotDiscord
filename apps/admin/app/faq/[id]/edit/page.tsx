import { notFound } from "next/navigation";

import { FaqForm } from "../../../components/FaqForm";
import { updateFaqAction } from "../../actions";
import { requireAdmin } from "../../../lib/auth";
import { getAdminDatabase } from "../../../lib/database";

type EditFAQPageProps = {
  params: {
    id: string;
  };
  searchParams: {
    success?: string;
  };
};

export default async function EditFAQPage({
  params,
  searchParams
}: EditFAQPageProps) {
  requireAdmin();

  const faq = await getAdminDatabase().getFaq(params.id);

  if (!faq) {
    notFound();
  }

  const updateCurrentFaq = updateFaqAction.bind(null, params.id);

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Edit FAQ</h1>
          <p className="muted">Update verified FAQ content and citation metadata.</p>
        </div>
      </div>
      {searchParams.success ? (
        <p className="message message-success">FAQ saved successfully.</p>
      ) : null}
      <FaqForm action={updateCurrentFaq} faq={faq} submitLabel="Save FAQ" />
    </main>
  );
}
