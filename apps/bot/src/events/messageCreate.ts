import type { Message } from "discord.js";

import type { NaturalQaRuntimeConfig } from "../config.js";
import type { BotContext } from "../services/commandRegistry.js";
import {
  discordMessageToNaturalQaMessage,
  handleNaturalQaMessage
} from "../services/naturalQa.js";

export async function handleMessageCreate(
  message: Message,
  context: BotContext,
  naturalQaConfig: NaturalQaRuntimeConfig
): Promise<void> {
  const naturalMessage = discordMessageToNaturalQaMessage(message);

  if (!naturalMessage) {
    return;
  }

  try {
    await handleNaturalQaMessage(naturalMessage, context, naturalQaConfig);
  } catch (error) {
    context.logger.error(
      {
        channelId: message.channelId,
        error,
        guildId: message.guildId
      },
      "Natural Q&A message handling failed"
    );
  }
}
