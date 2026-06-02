export type FAQStatus = "active" | "inactive";
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
  id: string;
  category: string;
  question: string;
  answer: string;
  sourceId: string | null;
  status: FAQStatus;
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
      faq_status: FAQStatus;
      feedback_vote: FeedbackVote;
    };
    CompositeTypes: Record<string, never>;
  };
};
