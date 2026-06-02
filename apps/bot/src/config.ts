import { parseEnv } from "@campus-qa/shared";
import { z } from "zod";

const requiredBotEnvSchema = z.object({
  AI_PROVIDER: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DISCORD_TOKEN: z.string().min(1),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
  NODE_ENV: z.enum(["development", "test", "production"]),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url()
});

export type BotConfig = z.infer<typeof requiredBotEnvSchema>;

export function loadConfig(): BotConfig {
  const env = parseEnv(process.env);
  return requiredBotEnvSchema.parse(env);
}
