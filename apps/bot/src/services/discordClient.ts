import { Client, GatewayIntentBits } from "discord.js";

import { handleInteractionCreate } from "../events/interactionCreate.js";
import { handleReady } from "../events/ready.js";
import type { BotContext } from "./commandRegistry.js";

export function createDiscordClient(context: BotContext): Client {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  client.once("ready", () => {
    handleReady(client, context.logger);
  });

  client.on("interactionCreate", (interaction) => {
    void handleInteractionCreate(interaction, context);
  });

  return client;
}
