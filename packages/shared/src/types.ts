export type Citation = {
  sourceId: string;
  title: string;
  url?: string;
  reference?: string;
};

export type VerifiedAnswer = {
  answer: string;
  citations: Citation[];
};
