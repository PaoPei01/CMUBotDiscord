export type DiscordInteraction = {
  application_id: string;
  data?: {
    name?: string;
    options?: Array<{
      name: string;
      type: number;
      value?: string;
    }>;
  };
  id: string;
  token: string;
  type: number;
};

export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title: string;
  color?: number;
  fields: DiscordEmbedField[];
};

export type DiscordWebhookPayload = {
  content?: string;
  embeds?: DiscordEmbed[];
};
