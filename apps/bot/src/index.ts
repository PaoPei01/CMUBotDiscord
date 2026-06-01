import { createSupabaseDatabaseService } from "@campus-qa/database";
import { createLogger } from "@campus-qa/shared";

import { loadConfig } from "./config.js";
import { createDiscordClient } from "./services/discordClient.js";

const config = loadConfig();
const logger = createLogger({ level: config.LOG_LEVEL, name: "bot" });
const database = createSupabaseDatabaseService({
  serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: config.SUPABASE_URL
});

const client = createDiscordClient({ database, logger });

try {
  logger.info({ environment: config.NODE_ENV }, "Starting Campus Discord Q&A Bot");
  await client.login(config.DISCORD_TOKEN);
} catch (error) {
  logger.error({ error }, "Bot startup failed");
  process.exitCode = 1;
}
