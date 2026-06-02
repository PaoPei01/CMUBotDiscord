import type { WorkerEnv } from "./env.js";
import { verifyDiscordRequest } from "./discord/verifyDiscordRequest.js";
import { deferredDiscordResponse, jsonResponse } from "./discord/respond.js";
import type { DiscordInteraction } from "./discord/types.js";
import { handleAskInteraction } from "./handlers/askHandler.js";
import { handleFeedbackInteraction } from "./handlers/feedbackHandler.js";

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("OK");
    }

    if (request.method !== "POST" || url.pathname !== "/discord") {
      return new Response("Not found", { status: 404 });
    }

    const rawBody = await request.text();
    const isVerified = verifyDiscordRequest({
      body: rawBody,
      publicKey: env.DISCORD_PUBLIC_KEY,
      signature: request.headers.get("X-Signature-Ed25519"),
      timestamp: request.headers.get("X-Signature-Timestamp")
    });

    if (!isVerified) {
      return new Response("Invalid request signature", { status: 401 });
    }

    const interaction = JSON.parse(rawBody) as DiscordInteraction;

    if (interaction.type === 1) {
      return jsonResponse({ type: 1 });
    }

    if (interaction.type === 2 && interaction.data?.name === "ask") {
      ctx.waitUntil(handleAskInteraction(interaction, env));
      return deferredDiscordResponse();
    }

    if (interaction.type === 3) {
      return handleFeedbackInteraction(interaction, env);
    }

    return jsonResponse({
      data: {
        content: "Unsupported command"
      },
      type: 4
    });
  }
};
