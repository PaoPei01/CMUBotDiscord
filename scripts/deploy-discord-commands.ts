type DiscordCommandOption = {
  description: string;
  name: string;
  required: boolean;
  type: number;
};

type DiscordCommand = {
  description: string;
  name: string;
  options: DiscordCommandOption[];
  type: number;
};

function requireEnv(candidates: string[]): string {
  for (const candidate of candidates) {
    const value = process.env[candidate]?.trim();

    if (value) {
      return value;
    }
  }

  throw new Error(`${candidates.join(" or ")} is required`);
}

async function readDiscordResponse(response: Response): Promise<string> {
  const text = await response.text();
  return text.length > 0 ? text : response.statusText;
}

const botToken = requireEnv(["DISCORD_BOT_TOKEN", "DISCORD_TOKEN"]);
const applicationId = requireEnv(["DISCORD_APPLICATION_ID", "DISCORD_CLIENT_ID"]);
const guildId = requireEnv(["DISCORD_GUILD_ID"]);

const commands: DiscordCommand[] = [
  {
    description: "ถามคำถามจากฐานข้อมูลนักศึกษา",
    name: "ask",
    options: [
      {
        description: "คำถามที่ต้องการถาม",
        name: "question",
        required: true,
        type: 3
      }
    ],
    type: 1
  }
];

const response = await fetch(
  `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`,
  {
    body: JSON.stringify(commands),
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json"
    },
    method: "PUT"
  }
);

if (!response.ok) {
  const message = await readDiscordResponse(response);
  throw new Error(`Discord command registration failed: ${response.status} ${message}`);
}

console.log(`Registered ${commands.length} worker slash command.`);
