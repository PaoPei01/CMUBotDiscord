import { parseEnv } from "@campus-qa/shared";
import { z } from "zod";

const requiredBotEnvSchema = z.object({
  AI_PROVIDER: z.string().optional(),
  CAMPUS_QA_CHANNEL_IDS: z.string().default(""),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DISCORD_TOKEN: z.string().min(1),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
  NATURAL_QA_ENABLED: z.string().default("false"),
  NATURAL_QA_MIN_QUESTION_LENGTH: z.string().default("4"),
  NATURAL_QA_PREFIXES: z.string().default("ถาม:,ถาม "),
  NATURAL_QA_REQUIRE_MENTION: z.string().default("true"),
  NODE_ENV: z.enum(["development", "test", "production"]),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url()
});

export type BotConfig = z.infer<typeof requiredBotEnvSchema>;

export type NaturalQaRuntimeConfig = {
  allowedChannelIds: string[];
  enabled: boolean;
  minQuestionLength: number;
  prefixes: string[];
  requireMention: boolean;
};

function booleanValue(value: string, fallback: boolean): boolean {
  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function csvValues(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function naturalQaConfig(config: BotConfig): NaturalQaRuntimeConfig {
  const minQuestionLength = Number(config.NATURAL_QA_MIN_QUESTION_LENGTH);

  return {
    allowedChannelIds: csvValues(config.CAMPUS_QA_CHANNEL_IDS),
    enabled: booleanValue(config.NATURAL_QA_ENABLED, false),
    minQuestionLength: Number.isFinite(minQuestionLength) && minQuestionLength > 0
      ? Math.floor(minQuestionLength)
      : 4,
    prefixes: csvValues(config.NATURAL_QA_PREFIXES),
    requireMention: booleanValue(config.NATURAL_QA_REQUIRE_MENTION, true)
  };
}

export function loadConfig(): BotConfig {
  const env = parseEnv(process.env);
  return requiredBotEnvSchema.parse(env);
}
