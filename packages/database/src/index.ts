export { createSupabaseClientPlaceholder } from "./client.js";
export {
  findFaqByExactQuestion,
  getActiveFaqs,
  logQuestion,
  saveFeedback
} from "./services.js";
export { createSupabaseAdminDatabase } from "./admin.js";
export { createSupabaseDatabaseService } from "./supabase.js";
export type {
  AdminDatabase,
  AdminFAQ,
  AdminFAQInput,
  AdminQuestionLog
} from "./admin.js";
export type { SupabaseClientPlaceholder } from "./client.js";
export type { DatabaseError, DatabaseResult, DatabaseServiceClient } from "./services.js";
export type {
  Database,
  FAQ,
  FAQAlias,
  FAQKeyword,
  FAQStatus,
  Feedback,
  FeedbackVote,
  NewFeedback,
  NewQuestionLog,
  QuestionLog,
  SearchResult,
  Source
} from "./types.js";
