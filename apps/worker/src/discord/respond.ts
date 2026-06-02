import type { DiscordWebhookPayload } from "./types.js";

export function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
}

export function deferredDiscordResponse(): Response {
  return jsonResponse({
    data: {
      content: "กำลังค้นหาข้อมูลจากฐานความรู้..."
    },
    type: 5
  });
}

export function ephemeralDiscordResponse(content: string): Response {
  return jsonResponse({
    data: {
      content,
      flags: 64
    },
    type: 4
  });
}

export async function editOriginalInteractionResponse({
  applicationId,
  payload,
  token
}: {
  applicationId: string;
  payload: DiscordWebhookPayload;
  token: string;
}): Promise<void> {
  const response = await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`,
    {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PATCH"
    }
  );

  if (!response.ok) {
    throw new Error(`Discord original response edit failed with status ${response.status}`);
  }
}
