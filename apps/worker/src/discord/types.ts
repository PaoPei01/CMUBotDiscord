export type DiscordInteraction = {
  application_id: string;
  data?: {
    component_type?: number;
    custom_id?: string;
    name?: string;
    options?: Array<{
      name: string;
      type: number;
      value?: string;
    }>;
  };
  guild_id?: string;
  id: string;
  member?: {
    user?: {
      id: string;
    };
  };
  message?: {
    id: string;
  };
  token: string;
  type: number;
  user?: {
    id: string;
  };
};

export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title: string;
  color?: number;
  description?: string;
  fields: DiscordEmbedField[];
};

export type DiscordButtonComponent = {
  custom_id: string;
  label: string;
  style: number;
  type: 2;
};

export type DiscordActionRowComponent = {
  components: DiscordButtonComponent[];
  type: 1;
};

export type DiscordWebhookPayload = {
  components?: DiscordActionRowComponent[];
  content?: string;
  embeds?: DiscordEmbed[];
  flags?: number;
};
