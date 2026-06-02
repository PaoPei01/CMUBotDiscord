import { AI_NOT_FOUND_MESSAGE } from "@campus-qa/ai";

import type { WorkerEnv } from "../env.js";
import { editOriginalInteractionResponse } from "../discord/respond.js";
import type { DiscordInteraction } from "../discord/types.js";
import { formatAnswerEmbed } from "../discord/formatAnswerEmbed.js";
import { composeWorkerAnswer } from "../services/aiComposer.js";
import { searchKnowledge, logQuestion } from "../services/knowledgeSearch.js";
import { createSupabaseClient } from "../services/supabaseClient.js";

function optionValue(interaction: DiscordInteraction, name: string): string | null {
  const option = interaction.data?.options?.find((candidate) => candidate.name === name);
  return typeof option?.value === "string" ? option.value.trim() : null;
}

function safeLog(payload: Record<string, unknown>): void {
  console.log(JSON.stringify(payload));
}

export async function handleAskInteraction(
  interaction: DiscordInteraction,
  env: WorkerEnv
): Promise<void> {
  const startedAt = Date.now();
  const question = optionValue(interaction, "question");
  const supabase = createSupabaseClient(env);

  if (!question) {
    await editOriginalInteractionResponse({
      applicationId: interaction.application_id,
      payload: { content: "กรุณาระบุคำถาม" },
      token: interaction.token
    });
    return;
  }

  try {
    const result = await searchKnowledge(supabase, question);
    const composition = await composeWorkerAnswer({
      aiProvider: null,
      question,
      result
    });
    const responseTimeMs = Date.now() - startedAt;

    await logQuestion(supabase, {
      confidence: result.confidence,
      discordGuildId: null,
      discordUserId: null,
      matchedFaqId: result.faqId,
      method: result.method,
      responseTimeMs,
      userQuestion: question
    });

    safeLog({
      ai_used: composition.aiUsed,
      confidence: result.confidence,
      failure_reason: composition.failureReason,
      method: result.method,
      model: composition.model,
      provider: composition.aiProvider,
      response_time_ms: responseTimeMs
    });

    if (!composition.shouldAnswer || !composition.answer) {
      await editOriginalInteractionResponse({
        applicationId: interaction.application_id,
        payload: { content: AI_NOT_FOUND_MESSAGE },
        token: interaction.token
      });
      return;
    }

    await editOriginalInteractionResponse({
      applicationId: interaction.application_id,
      payload: {
        embeds: [
          formatAnswerEmbed({
            answer: result.answerShort ?? composition.answer,
            question,
            result,
            sourceNames: composition.sources.map((source) => source.name)
          })
        ]
      },
      token: interaction.token
    });
  } catch {
    safeLog({
      ai_used: false,
      failure_reason: "worker_ask_failed",
      provider: null
    });

    await editOriginalInteractionResponse({
      applicationId: interaction.application_id,
      payload: { content: "ขออภัย ระบบไม่สามารถค้นหาคำตอบได้ในขณะนี้" },
      token: interaction.token
    });
  }
}
