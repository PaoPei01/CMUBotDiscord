import type { Client } from "discord.js";
import type { BotLogger } from "../services/commandRegistry.js";

export function handleReady(client: Client, logger: BotLogger): void {
  logger.info(
    {
      botUserId: client.user?.id,
      botUsername: client.user?.tag
    },
    "Discord bot is ready"
  );
}
