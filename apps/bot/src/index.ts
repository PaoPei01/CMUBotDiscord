import { createAIProviderFromEnv } from "@campus-qa/ai";
import { createSupabaseDatabaseService, getKnowledgeEntries } from "@campus-qa/database";
import { KnowledgeEngine } from "@campus-qa/knowledge";
import { createLogger } from "@campus-qa/shared";

import { loadConfig, naturalQaConfig } from "./config.js";
import { createDiscordClient } from "./services/discordClient.js";

const config = loadConfig();
const naturalQa = naturalQaConfig(config);
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
const aiProvider = createAIProviderFromEnv({
  AI_PROVIDER: config.AI_PROVIDER,
  GEMINI_API_KEY: config.GEMINI_API_KEY,
  GROQ_API_KEY: config.GROQ_API_KEY
});

const client = createDiscordClient({ aiProvider, database, knowledge, logger }, naturalQa);

try {
  logger.info(
    {
      aiProvider: aiProvider?.providerName ?? null,
      environment: config.NODE_ENV,
      naturalQaEnabled: naturalQa.enabled
    },
    "Starting Campus Discord Q&A Bot"
  );
  await client.login(config.DISCORD_TOKEN);
} catch (error) {
  logger.error({ error }, "Bot startup failed");
  process.exitCode = 1;
}
