import { createSupabaseDatabaseService, getKnowledgeEntries } from "@campus-qa/database";
import { KnowledgeEngine } from "@campus-qa/knowledge";
import { createLogger } from "@campus-qa/shared";

import { loadConfig } from "./config.js";
import { createDiscordClient } from "./services/discordClient.js";

const config = loadConfig();
const logger = createLogger({ level: config.LOG_LEVEL, name: "bot" });
const database = createSupabaseDatabaseService({
  serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: config.SUPABASE_URL
});
const knowledge = new KnowledgeEngine({
  getKnowledgeEntries() {
    return getKnowledgeEntries(database);
  }
});

const client = createDiscordClient({ database, knowledge, logger });

try {
  logger.info({ environment: config.NODE_ENV }, "Starting Campus Discord Q&A Bot");
  await client.login(config.DISCORD_TOKEN);
} catch (error) {
  logger.error({ error }, "Bot startup failed");
  process.exitCode = 1;
}
