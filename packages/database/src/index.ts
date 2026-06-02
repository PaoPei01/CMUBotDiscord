export { createSupabaseClientPlaceholder } from "./client.js";
export {
  findFaqByExactQuestion,
  findSimilarKnowledgeByEmbedding,
  getActiveFaqs,
  getExistingEmbeddingFaqIds,
  getKnowledgeEntries,
  logQuestion,
  saveFeedback,
  upsertFaqEmbedding
} from "./services.js";
export { createSupabaseAdminDatabase } from "./admin.js";
export { createSupabaseDatabaseService } from "./supabase.js";
export { parseFaqCsv } from "./import/parseFaqCsv.js";
export { importFaqs } from "./import/importFaqs.js";
export { validateFaqImportRow } from "./import/validateFaqImportRow.js";
export { faqCsvHeaders } from "./import/types.js";
export type {
  AdminDatabase,
  AdminDraftFAQ,
  AdminDraftFAQInput,
  AdminFAQ,
  AdminFAQInput,
  AdminImportLog,
  AdminIngestionInput,
  AdminKnowledgeReview,
  AdminQuestionLog
} from "./admin.js";
export type { SupabaseClientPlaceholder } from "./client.js";
export type {
  DatabaseError,
  DatabaseResult,
  DatabaseServiceClient,
  KnowledgeEntryRow,
  VectorKnowledgeEntryRow
} from "./services.js";
export type {
  Database,
  FAQ,
  FAQAlias,
  FAQEmbedding,
  FAQImportError,
  FAQImportResult,
  FAQImportRow,
  FAQKeyword,
  FAQPriority,
  FAQRelation,
  FAQStatus,
  Feedback,
  FeedbackVote,
  NewFAQEmbedding,
  NewFeedback,
  NewQuestionLog,
  QuestionLog,
  SearchResult,
  Source
} from "./types.js";
export type {
  FaqImportInput,
  ParsedFaqCsv,
  RawFaqCsvRow,
  ValidatedFaqImportRow
} from "./import/types.js";
