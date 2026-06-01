import type { Citation } from "@campus-qa/shared";

export type AIComposeInput = {
  question: string;
  verifiedContext: string;
  citations: Citation[];
};

export type AIComposeResult = {
  answer: string;
  citations: Citation[];
};

export interface AIProvider {
  composeAnswer(input: AIComposeInput): Promise<AIComposeResult>;
}
