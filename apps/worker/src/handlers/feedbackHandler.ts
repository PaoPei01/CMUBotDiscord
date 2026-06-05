import type { WorkerEnv } from "../env.js";
import { parseFeedbackCustomId } from "../discord/feedbackComponents.js";
import { ephemeralDiscordResponse } from "../discord/respond.js";
import type { DiscordInteraction } from "../discord/types.js";
import { saveFeedback } from "../services/knowledgeSearch.js";
import { createSupabaseClient } from "../services/supabaseClient.js";

function discordUserId(interaction: DiscordInteraction): string | null {
  return interaction.member?.user?.id ?? interaction.user?.id ?? null;
}

function safeLog(payload: Record<string, unknown>): void {
  console.log(JSON.stringify(payload));
}

export async function handleFeedbackInteraction(
  interaction: DiscordInteraction,
  env: WorkerEnv
): Promise<Response> {
  const feedback = parseFeedbackCustomId(interaction.data?.custom_id);

  if (!feedback) {
    return ephemeralDiscordResponse("ไม่สามารถบันทึก feedback ได้");
  }

  try {
    await saveFeedback(createSupabaseClient(env), {
      discordUserId: discordUserId(interaction),
      questionLogId: feedback.questionLogId,
      vote: feedback.vote
    });

    return ephemeralDiscordResponse("บันทึก feedback แล้ว");
  } catch {
    safeLog({
      failure_reason: "feedback_save_failed"
    });
    return ephemeralDiscordResponse("ไม่สามารถบันทึก feedback ได้");
  }
}
