export type RetrievedContext = {
  faqId: string;
  answer: string;
  question: string;
  sourceName: string;
  sourceUrl: string | null;
};

export type AIAnswer = {
  answer: string;
  citedSourceNames: string[];
  notFound: boolean;
};

export type AIGenerateAnswerInput = {
  question: string;
  contexts: RetrievedContext[];
};

export interface AIProvider {
  readonly providerName: string;
  generateAnswer(input: AIGenerateAnswerInput): Promise<AIAnswer>;
}
