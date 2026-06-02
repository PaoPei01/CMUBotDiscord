import { logQuestion } from "@campus-qa/database";
import type { SearchResult } from "@campus-qa/knowledge";
import { SlashCommandBuilder } from "discord.js";

import type { BotCommand } from "../services/commandRegistry.js";
import {
  createAnswerComponents,
  createAnswerEmbed,
  createNotFoundComponents,
  createNotFoundEmbed,
  NOT_FOUND_MESSAGE
} from "../utils/formatAnswer.js";

function normalizeQuestion(question: string): string {
  return question.trim().replace(/\s+/g, " ");
}

function shouldShowAnswer(searchResult: SearchResult): boolean {
  return searchResult.answer !== null && searchResult.faqId !== null && searchResult.confidence >= 60;
}

export const askCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask a question from the verified FAQ database")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("Student question to search in verified FAQ data")
        .setRequired(true)
    ),
  async execute(interaction, context) {
    const startedAt = Date.now();
    const rawQuestion = interaction.options.getString("question", true);
    const question = normalizeQuestion(rawQuestion);

    context.logger.info(
      {
        command: "ask",
        guildId: interaction.guildId,
        userId: interaction.user.id
      },
      "Executing ask command"
    );

    if (question.length === 0) {
      await interaction.reply({
        content: "กรุณาระบุคำถาม",
        ephemeral: true
      });
      return;
    }

    try {
      const searchResult = await context.knowledge.searchKnowledge(question);
      const responseTimeMs = Date.now() - startedAt;

      const questionLog = await logQuestion(context.database, {
        confidence: searchResult.confidence,
        discordGuildId: interaction.guildId,
        discordUserId: interaction.user.id,
        matchedFaqId: searchResult.faqId,
        method: searchResult.method,
        responseTimeMs,
        userQuestion: question
      });

      context.logger.info(
        {
          command: "ask",
          confidence: searchResult.confidence,
          matchedFaqId: searchResult.faqId,
          method: searchResult.method,
          questionLogId: questionLog.id,
          responseTimeMs
        },
        "Completed ask command search"
      );

      if (shouldShowAnswer(searchResult)) {
        await interaction.reply({
          components: createAnswerComponents(questionLog.id),
          embeds: [createAnswerEmbed({ question, result: searchResult })]
        });
        return;
      }

      await interaction.reply({
        components: createNotFoundComponents(questionLog.id),
        embeds: [createNotFoundEmbed(question)]
      });
    } catch (error) {
      context.logger.error(
        {
          command: "ask",
          error,
          guildId: interaction.guildId,
          searchMethod: "knowledge"
        },
        "Ask command failed"
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "ขออภัย ระบบไม่สามารถค้นหาคำตอบได้ในขณะนี้",
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: "ขออภัย ระบบไม่สามารถค้นหาคำตอบได้ในขณะนี้",
        ephemeral: true
      });
    }
  }
};

export { NOT_FOUND_MESSAGE };
