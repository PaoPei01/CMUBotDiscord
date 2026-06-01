import { saveFeedback } from "@campus-qa/database";
import type { Interaction } from "discord.js";

import { commands } from "../services/commandRegistry.js";
import type { BotContext } from "../services/commandRegistry.js";

function parseFeedbackCustomId(
  customId: string
): { questionLogId: string; vote: "up" | "down" } | null {
  const [prefix, questionLogId, vote] = customId.split(":");

  if (prefix !== "feedback" || !questionLogId) {
    return null;
  }

  if (vote !== "up" && vote !== "down") {
    return null;
  }

  return { questionLogId, vote };
}

export async function handleInteractionCreate(
  interaction: Interaction,
  context: BotContext
): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);

      if (!command) {
        context.logger.warn(
          { commandName: interaction.commandName },
          "Unknown slash command"
        );
        return;
      }

      context.logger.info(
        { commandName: interaction.commandName },
        "Received slash command"
      );
      await command.execute(interaction, context);
      return;
    }

    if (interaction.isButton()) {
      const feedback = parseFeedbackCustomId(interaction.customId);

      if (!feedback) {
        return;
      }

      await saveFeedback(context.database, {
        discordUserId: interaction.user.id,
        questionLogId: feedback.questionLogId,
        vote: feedback.vote
      });

      context.logger.info(
        {
          questionLogId: feedback.questionLogId,
          userId: interaction.user.id,
          vote: feedback.vote
        },
        "Saved feedback vote"
      );

      await interaction.reply({
        content: "บันทึก feedback แล้ว",
        ephemeral: true
      });
    }
  } catch (error) {
    context.logger.error({ error }, "Interaction handling failed");

    if (
      interaction.isRepliable() &&
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content: "ขออภัย ระบบเกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        ephemeral: true
      });
    }
  }
}
