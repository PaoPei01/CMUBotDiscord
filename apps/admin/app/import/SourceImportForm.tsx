import { defaultChunkingOptions } from "@campus-qa/knowledge";

import { submitKnowledgeImportAction } from "./actions";
import { SourceImportFormClient } from "./SourceImportFormClient";

export function SourceImportForm() {
  return (
    <SourceImportFormClient
      action={submitKnowledgeImportAction}
      chunkSizeWords={defaultChunkingOptions.chunkSizeWords}
      overlapWords={defaultChunkingOptions.overlapWords}
    />
  );
}
