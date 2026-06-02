import { describe, expect, it } from "vitest";

import {
  createFeedbackComponents,
  parseFeedbackCustomId
} from "../src/discord/feedbackComponents.js";
import { ephemeralDiscordResponse } from "../src/discord/respond.js";
import { saveFeedback } from "../src/services/knowledgeSearch.js";
import type { SupabaseFetchClient } from "../src/services/supabaseClient.js";

describe("worker feedback components", () => {
  it("parses valid feedback custom ids", () => {
    expect(parseFeedbackCustomId("feedback:log-1:up")).toEqual({
      questionLogId: "log-1",
      vote: "up"
    });
    expect(parseFeedbackCustomId("feedback:log-1:down")).toEqual({
      questionLogId: "log-1",
      vote: "down"
    });
  });

  it("rejects invalid feedback custom ids", () => {
    expect(parseFeedbackCustomId(null)).toBeNull();
    expect(parseFeedbackCustomId("feedback::up")).toBeNull();
    expect(parseFeedbackCustomId("feedback:log-1:bad")).toBeNull();
    expect(parseFeedbackCustomId("other:log-1:up")).toBeNull();
  });

  it("creates success and danger feedback buttons", () => {
    expect(createFeedbackComponents("log-1")).toEqual([
      {
        components: [
          {
            custom_id: "feedback:log-1:up",
            label: "👍 ตรง",
            style: 3,
            type: 2
          },
          {
            custom_id: "feedback:log-1:down",
            label: "👎 ไม่ตรง",
            style: 4,
            type: 2
          }
        ],
        type: 1
      }
    ]);
  });

  it("saves feedback payload without secrets", async () => {
    const calls: Array<{ body: unknown; path: string }> = [];
    const client: SupabaseFetchClient = {
      request<T>(path: string, init?: RequestInit): Promise<T> {
        calls.push({
          body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
          path
        });
        return Promise.resolve(undefined as T);
      }
    };

    await saveFeedback(client, {
      discordUserId: "user-1",
      questionLogId: "log-1",
      vote: "up"
    });

    expect(calls).toEqual([
      {
        body: {
          discord_user_id: "user-1",
          question_log_id: "log-1",
          vote: "up"
        },
        path: "feedback"
      }
    ]);
    expect(JSON.stringify(calls)).not.toContain("GEMINI_API_KEY");
  });

  it("creates ephemeral feedback responses", async () => {
    const response = ephemeralDiscordResponse("บันทึก feedback แล้ว");
    const payload = await response.json();

    expect(payload).toEqual({
      data: {
        content: "บันทึก feedback แล้ว",
        flags: 64
      },
      type: 4
    });
  });
});
