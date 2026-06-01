import pino, { type Logger } from "pino";

export type LoggerOptions = {
  level?: string;
  name?: string;
};

export function createLogger(options: LoggerOptions = {}): Logger {
  return pino({
    level: options.level ?? "info",
    name: options.name ?? "campus-qa"
  });
}
