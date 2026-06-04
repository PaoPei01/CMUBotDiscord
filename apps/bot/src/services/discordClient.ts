import { Client, GatewayIntentBits } from "discord.js";

import { handleInteractionCreate } from "../events/interactionCreate.js";
import { handleMessageCreate } from "../events/messageCreate.js";
import { handleReady } from "../events/ready.js";
import type { NaturalQaRuntimeConfig } from "../config.js";
import type { BotContext } from "./commandRegistry.js";

export function createDiscordClient(
  context: BotContext,
  naturalQaConfig: NaturalQaRuntimeConfig
): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", () => {
    handleReady(client, context.logger);
  });

  client.on("interactionCreate", (interaction) => {
    void handleInteractionCreate(interaction, context);
  });

  client.on("messageCreate", (message) => {
    void handleMessageCreate(message, context, naturalQaConfig);
  });

  return client;
}
