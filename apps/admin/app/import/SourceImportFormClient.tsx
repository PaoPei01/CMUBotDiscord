"use client";

import { useFormState } from "react-dom";

import type { ImportKnowledgeActionState } from "./actions";
import { SourceImportSubmitButton } from "./SourceImportSubmitButton";

type SourceImportFormClientProps = {
  action: (
    state: ImportKnowledgeActionState,
    formData: FormData
  ) => Promise<ImportKnowledgeActionState>;
  chunkSizeWords: number;
  overlapWords: number;
};

const initialState: ImportKnowledgeActionState = {
  error: null
};

export function SourceImportFormClient({
  action,
  chunkSizeWords,
  overlapWords
}: SourceImportFormClientProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="panel form-grid">
      <label className="field field-full">
        Source URL
        <input name="url" placeholder="https://example.edu/admissions/faq" type="url" />
      </label>

      <label className="field field-full">
        Source file
        <input
          accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          name="file"
          type="file"
        />
      </label>

      <label className="field">
        Chunk size words
        <input
          defaultValue={chunkSizeWords}
          min={100}
          name="chunkSizeWords"
          step={50}
          type="number"
        />
      </label>

      <label className="field">
        Overlap words
        <input
          defaultValue={overlapWords}
          min={0}
          name="overlapWords"
          step={25}
          type="number"
        />
      </label>

      {state.error ? <p className="message message-error field-full">{state.error}</p> : null}

      <div className="actions field-full">
        <SourceImportSubmitButton />
      </div>
    </form>
  );
}
