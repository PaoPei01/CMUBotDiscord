import type {
  FAQ,
  FAQEmbedding,
  Feedback,
  NewFAQEmbedding,
  NewFeedback,
  NewQuestionLog,
  QuestionLog,
  SearchResult,
  Source
} from "./types.js";

export type KnowledgeEntryRow = FAQ & {
  aliases: string[];
  faqId: string;
  keywords: string[];
  source: Source | null;
};

export type VectorKnowledgeEntryRow = KnowledgeEntryRow & {
  embeddingContent: string;
  similarity: number;
};

export type DatabaseError = {
  message: string;
};

export type DatabaseResult<T> = {
  data: T | null;
  error: DatabaseError | null;
};

export type DatabaseServiceClient = {
  getActiveFaqs(): Promise<DatabaseResult<Array<FAQ & { source: Source | null }>>>;
  getKnowledgeEntries(): Promise<DatabaseResult<KnowledgeEntryRow[]>>;
  getExistingEmbeddingFaqIds(modelName: string): Promise<DatabaseResult<string[]>>;
  findSimilarKnowledgeByEmbedding(input: {
    embedding: number[];
    limit?: number;
    modelName: string;
  }): Promise<DatabaseResult<VectorKnowledgeEntryRow[]>>;
  findFaqByExactQuestion(
    question: string
  ): Promise<DatabaseResult<(FAQ & { source: Source | null }) | null>>;
  upsertFaqEmbedding(input: NewFAQEmbedding): Promise<DatabaseResult<FAQEmbedding>>;
  insertQuestionLog(input: NewQuestionLog): Promise<DatabaseResult<QuestionLog>>;
  insertFeedback(input: NewFeedback): Promise<DatabaseResult<Feedback>>;
};

function assertDatabaseResult<T>(result: DatabaseResult<T>): T {
  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.data === null) {
    throw new Error("Database operation returned no data");
  }

  return result.data;
}

function toFaq(row: FAQ & { source: Source | null }): FAQ {
  return {
    answer: row.answer,
    answerFull: row.answerFull,
    answerShort: row.answerShort,
    audience: row.audience,
    category: row.category,
    createdAt: row.createdAt,
    faqCode: row.faqCode,
    facultyGroup: row.facultyGroup,
    id: row.id,
    priority: row.priority,
    question: row.question,
    sourcePage: row.sourcePage,
    sourceQuote: row.sourceQuote,
    sourceId: row.sourceId,
    status: row.status,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    updatedAt: row.updatedAt
  };
}

export async function getActiveFaqs(client: DatabaseServiceClient): Promise<FAQ[]> {
  const rows = assertDatabaseResult(await client.getActiveFaqs());
  return rows.map(toFaq);
}

export async function getKnowledgeEntries(
  client: DatabaseServiceClient
): Promise<KnowledgeEntryRow[]> {
  return assertDatabaseResult(await client.getKnowledgeEntries());
}

export async function getExistingEmbeddingFaqIds(
  client: DatabaseServiceClient,
  modelName: string
): Promise<string[]> {
  return assertDatabaseResult(await client.getExistingEmbeddingFaqIds(modelName));
}

export async function findSimilarKnowledgeByEmbedding(
  client: DatabaseServiceClient,
  input: {
    embedding: number[];
    limit?: number;
    modelName: string;
  }
): Promise<VectorKnowledgeEntryRow[]> {
  return assertDatabaseResult(await client.findSimilarKnowledgeByEmbedding(input));
}

export async function upsertFaqEmbedding(
  client: DatabaseServiceClient,
  input: NewFAQEmbedding
): Promise<FAQEmbedding> {
  return assertDatabaseResult(await client.upsertFaqEmbedding(input));
}

export async function findFaqByExactQuestion(
  client: DatabaseServiceClient,
  question: string
): Promise<SearchResult | null> {
  const normalizedQuestion = question.trim();

  if (normalizedQuestion.length === 0) {
    return null;
  }

  const row = assertDatabaseResult(
    await client.findFaqByExactQuestion(normalizedQuestion)
  );

  if (!row) {
    return null;
  }

  return {
    confidence: 1,
    faq: toFaq(row),
    method: "exact",
    source: row.source
  };
}

export async function logQuestion(
  client: DatabaseServiceClient,
  input: NewQuestionLog
): Promise<QuestionLog> {
  return assertDatabaseResult(await client.insertQuestionLog(input));
}

export async function saveFeedback(
  client: DatabaseServiceClient,
  input: NewFeedback
): Promise<Feedback> {
  return assertDatabaseResult(await client.insertFeedback(input));
}
