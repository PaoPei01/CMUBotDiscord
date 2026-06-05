import { logQuestion } from "@campus-qa/database";
import type { SearchResult } from "@campus-qa/knowledge";
import { SlashCommandBuilder } from "discord.js";

import type { BotCommand } from "../services/commandRegistry.js";
import { composeAskAnswer } from "../services/aiAnswerComposer.js";
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

function isAllowedSearchResult(result: SearchResult): boolean {
  return (
    result.status === "active" &&
    Boolean(result.faqId) &&
    Boolean(result.answerShort ?? result.answer) &&
    Boolean(result.source?.name)
  );
}

function toNotFoundResult(result: SearchResult): SearchResult {
  return {
    ...result,
    answer: null,
    answerFull: null,
    answerShort: null,
    confidence: 0,
    faqId: null,
    matchedQuestion: null,
    method: "none",
    source: null
  };
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
      const rawSearchResult = await context.knowledge.searchKnowledge(question);
      const searchResult = isAllowedSearchResult(rawSearchResult)
        ? rawSearchResult
        : toNotFoundResult(rawSearchResult);
      const answerComposition = await composeAskAnswer({
        aiProvider: null,
        question,
        searchResult
      });
      const responseTimeMs = Date.now() - startedAt;

      const questionLog = await logQuestion(context.database, {
        confidence: answerComposition.result.confidence,
        discordGuildId: interaction.guildId,
        discordUserId: interaction.user.id,
        matchedFaqId: answerComposition.result.faqId,
        method: answerComposition.result.method,
        responseTimeMs,
        userQuestion: question
      }).catch((error: unknown) => {
        context.logger.warn(
          {
            command: "ask",
            errorMessage: error instanceof Error ? error.message : "Unknown log error"
          },
          "Ask command question logging failed"
        );
        return null;
      });

      context.logger.info(
        {
          command: "ask",
          ai_provider: answerComposition.aiProvider,
          ai_used: answerComposition.aiUsed,
          confidence: answerComposition.result.confidence,
          failure_reason: answerComposition.failureReason,
          matchedFaqId: answerComposition.result.faqId,
          method: answerComposition.result.method,
          prompt_context_count: answerComposition.promptContextCount,
          questionLogId: questionLog?.id ?? null,
          responseTimeMs
        },
        "Completed ask command search"
      );

      if (answerComposition.shouldReplyWithAnswer) {
        await interaction.reply({
          ...(questionLog ? { components: createAnswerComponents(questionLog.id) } : {}),
          embeds: [createAnswerEmbed({ question, result: answerComposition.result })]
        });
        return;
      }

      await interaction.reply({
        ...(questionLog ? { components: createNotFoundComponents(questionLog.id) } : {}),
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
