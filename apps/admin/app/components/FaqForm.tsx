import type { AdminFAQ } from "@campus-qa/database";

type FaqFormProps = {
  action: (formData: FormData) => Promise<void>;
  faq?: AdminFAQ;
  submitLabel: string;
};

function dateValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function FaqForm({ action, faq, submitLabel }: FaqFormProps) {
  return (
    <form action={action} className="panel form-grid">
      <label className="field">
        Category
        <input defaultValue={faq?.category} name="category" required />
      </label>
      <label className="field">
        Status
        <select defaultValue={faq?.status ?? "active"} name="status" required>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
      <label className="field field-full">
        Question
        <input defaultValue={faq?.question} name="question" required />
      </label>
      <label className="field field-full">
        Answer
        <textarea defaultValue={faq?.answer} name="answer" required />
      </label>
      <label className="field field-full">
        Aliases
        <textarea
          defaultValue={faq?.aliases.map((alias) => alias.alias).join("\n")}
          name="aliases"
          placeholder="One alias per line or comma-separated"
        />
      </label>
      <label className="field field-full">
        Keywords
        <textarea
          defaultValue={faq?.keywords.map((keyword) => keyword.keyword).join("\n")}
          name="keywords"
          placeholder="One keyword per line or comma-separated"
        />
      </label>
      <label className="field">
        Source name
        <input defaultValue={faq?.source?.name} name="sourceName" required />
      </label>
      <label className="field">
        Source URL
        <input defaultValue={faq?.source?.url ?? ""} name="sourceUrl" type="url" />
      </label>
      <label className="field">
        Last verified date
        <input
          defaultValue={dateValue(faq?.source?.last_verified_at)}
          name="lastVerifiedAt"
          type="date"
        />
      </label>
      <div className="actions field-full">
        <button className="button" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
