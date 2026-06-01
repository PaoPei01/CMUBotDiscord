export { createSupabaseClientPlaceholder } from "./client.js";
export {
  findFaqByExactQuestion,
  getActiveFaqs,
  logQuestion,
  saveFeedback
} from "./services.js";
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
