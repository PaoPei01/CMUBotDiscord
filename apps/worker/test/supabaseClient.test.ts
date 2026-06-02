import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseClient } from "../src/services/supabaseClient.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createSupabaseClient", () => {
  it("handles successful Supabase responses with empty bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("", { status: 201 })))
    );

    const client = createSupabaseClient({
      DISCORD_APPLICATION_ID: "app",
      DISCORD_PUBLIC_KEY: "public",
      GEMINI_API_KEY: "gemini",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      SUPABASE_URL: "https://example.supabase.co"
    });

    await expect(
      client.request("feedback", {
        body: JSON.stringify({
          question_log_id: "log-1",
          vote: "up"
        }),
        method: "POST"
      })
    ).resolves.toBeUndefined();
  });
});
