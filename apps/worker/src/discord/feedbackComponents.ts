import type { DiscordActionRowComponent } from "./types.js";

export type FeedbackVote = "up" | "down";

export type ParsedFeedbackCustomId = {
  questionLogId: string;
  vote: FeedbackVote;
};

export function createFeedbackComponents(
  questionLogId: string
): DiscordActionRowComponent[] {
  return [
    {
      components: [
        {
          custom_id: `feedback:${questionLogId}:up`,
          label: "👍 ตรง",
          style: 3,
          type: 2
        },
        {
          custom_id: `feedback:${questionLogId}:down`,
          label: "👎 ไม่ตรง",
          style: 4,
          type: 2
        }
      ],
      type: 1
    }
  ];
}

export function parseFeedbackCustomId(
  customId: string | null | undefined
): ParsedFeedbackCustomId | null {
  if (!customId) {
    return null;
  }

  const [prefix, questionLogId, vote] = customId.split(":");

  if (prefix !== "feedback" || !questionLogId) {
    return null;
  }

  if (vote !== "up" && vote !== "down") {
    return null;
  }

  return {
    questionLogId,
    vote
  };
}
