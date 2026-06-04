export type FAQStatus = "active" | "draft" | "expired" | "inactive";
export type FAQPriority = "high" | "medium" | "low";
export type FeedbackVote = "up" | "down";

export type Source = {
  id: string;
  name: string;
  url: string | null;
  sourceType: string;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FAQ = {
  answer: string;
  answerFull: string | null;
  answerShort: string;
  audience: string | null;
  id: string;
  category: string;
  faqCode: string;
  facultyGroup: string | null;
  question: string;
  priority: FAQPriority;
  sourcePage: string | null;
  sourceQuote: string | null;
  sourceId: string | null;
  status: FAQStatus;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FAQAlias = {
  id: string;
  faqId: string;
  alias: string;
  createdAt: string;
};

export type FAQKeyword = {
  id: string;
  faqId: string;
  keyword: string;
  createdAt: string;
};

export type FAQRelation = {
  id: string;
  faqId: string;
  relatedFaqId: string;
  createdAt: string;
};

export type FAQEmbedding = {
  id: string;
  faqId: string;
  content: string;
  embedding: number[] | null;
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchResult = {
  faq: FAQ;
  source: Source | null;
  confidence: number;
  method: "exact";
};

export type QuestionLog = {
  id: string;
  userQuestion: string;
  matchedFaqId: string | null;
  confidence: number | null;
  method: string | null;
  responseTimeMs: number | null;
  discordUserId: string | null;
  discordGuildId: string | null;
  triggerType: string | null;
  intent: string | null;
  createdAt: string;
};

export type Feedback = {
  id: string;
  questionLogId: string;
  vote: FeedbackVote;
  comment: string | null;
  discordUserId: string | null;
  createdAt: string;
};

export type NewQuestionLog = {
  userQuestion: string;
  matchedFaqId?: string | null;
  confidence?: number | null;
  method?: string | null;
  responseTimeMs?: number | null;
  discordUserId?: string | null;
  discordGuildId?: string | null;
  triggerType?: string | null;
  intent?: string | null;
};

export type NewFeedback = {
  questionLogId: string;
  vote: FeedbackVote;
  comment?: string | null;
  discordUserId?: string | null;
};

export type NewFAQEmbedding = {
  faqId: string;
  content: string;
  embedding: number[];
  embeddingModel: string;
};

export type FAQImportRow = {
  aliases: string[];
  answerFull: string | null;
  answerShort: string;
  audience: string | null;
  category: string;
  facultyGroup: string | null;
  faqId: string;
  keywords: string[];
  lastVerified: string;
  priority: FAQPriority;
  question: string;
  relatedFaqIds: string[];
  sourceName: string;
  sourcePage: string | null;
  sourceQuote: string | null;
  sourceUrl: string | null;
  status: FAQStatus;
  validFrom: string | null;
  validUntil: string | null;
};

export type FAQImportError = {
  error: string;
  faqId: string | null;
  field: string;
  rowNumber: number;
};

export type FAQImportResult = {
  aliasesImported: number;
  createdFaqs: number;
  createdSources: number;
  dryRun: boolean;
  keywordsImported: number;
  relatedFaqLinksImported: number;
  skippedRows: number;
  totalRows: number;
  updatedFaqs: number;
  updatedSources: number;
  validationErrors: FAQImportError[];
};

export type Database = {
  public: {
    Tables: {
      sources: {
        Row: Source;
        Insert: Omit<Source, "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<Source>;
      };
      faqs: {
        Row: FAQ;
        Insert: Omit<FAQ, "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<FAQ>;
      };
      faq_aliases: {
        Row: FAQAlias;
        Insert: Omit<FAQAlias, "id" | "createdAt"> & {
          id?: string;
          createdAt?: string;
        };
        Update: Partial<FAQAlias>;
      };
      faq_keywords: {
        Row: FAQKeyword;
        Insert: Omit<FAQKeyword, "id" | "createdAt"> & {
          id?: string;
          createdAt?: string;
        };
        Update: Partial<FAQKeyword>;
      };
      faq_relations: {
        Row: FAQRelation;
        Insert: Omit<FAQRelation, "id" | "createdAt"> & {
          id?: string;
          createdAt?: string;
        };
        Update: Partial<FAQRelation>;
      };
      faq_embeddings: {
        Row: FAQEmbedding;
        Insert: Omit<FAQEmbedding, "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<FAQEmbedding>;
      };
      question_logs: {
        Row: QuestionLog;
        Insert: NewQuestionLog;
        Update: Partial<QuestionLog>;
      };
      feedback: {
        Row: Feedback;
        Insert: NewFeedback;
        Update: Partial<Feedback>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      faq_priority: FAQPriority;
      faq_status: FAQStatus;
      feedback_vote: FeedbackVote;
    };
    CompositeTypes: Record<string, never>;
  };
};
