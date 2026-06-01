import { createLogger, parseEnv } from "@campus-qa/shared";

const env = parseEnv(process.env);
const logger = createLogger({ level: env.LOG_LEVEL, name: "bot" });

logger.info(
  {
    environment: env.NODE_ENV
  },
  "Campus Discord Q&A Bot health startup complete"
);
