import { defaultChunkingOptions } from "@campus-qa/knowledge";

import { importKnowledgeAction } from "./actions";
import { SourceImportSubmitButton } from "./SourceImportSubmitButton";

export function SourceImportForm() {
  return (
    <form action={importKnowledgeAction} className="panel form-grid">
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
          defaultValue={defaultChunkingOptions.chunkSizeWords}
          min={100}
          name="chunkSizeWords"
          step={50}
          type="number"
        />
      </label>

      <label className="field">
        Overlap words
        <input
          defaultValue={defaultChunkingOptions.overlapWords}
          min={0}
          name="overlapWords"
          step={25}
          type="number"
        />
      </label>

      <div className="actions field-full">
        <SourceImportSubmitButton />
      </div>
    </form>
  );
}
