"use client";

import { useFormStatus } from "react-dom";

export function SourceImportSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button" disabled={pending} type="submit">
      {pending ? "Generating..." : "Generate draft FAQs"}
    </button>
  );
}
