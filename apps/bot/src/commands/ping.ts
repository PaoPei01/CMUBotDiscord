import { SlashCommandBuilder } from "discord.js";

import type { BotCommand } from "../services/commandRegistry.js";

export const pingCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Health check for the Campus Q&A bot"),
  async execute(interaction) {
    await interaction.reply("pong");
  }
};
