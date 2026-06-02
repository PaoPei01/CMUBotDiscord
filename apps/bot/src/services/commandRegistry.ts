import type { DatabaseServiceClient } from "@campus-qa/database";
import type { KnowledgeEngine } from "@campus-qa/knowledge";
import type { ChatInputCommandInteraction } from "discord.js";

import { askCommand } from "../commands/ask.js";
import { pingCommand } from "../commands/ping.js";

export type BotLogger = {
  error(payload: object, message: string): void;
  info(payload: object, message: string): void;
  warn(payload: object, message: string): void;
};

export type BotContext = {
  database: DatabaseServiceClient;
  knowledge: KnowledgeEngine;
  logger: BotLogger;
};

export type BotCommand = {
  data: {
    readonly name: string;
    toJSON(): unknown;
  };
  execute(
    interaction: ChatInputCommandInteraction,
    context: BotContext
  ): Promise<void>;
};

export const commandList = [pingCommand, askCommand];

export const commands = new Map(
  commandList.map((command) => [command.data.name, command])
);

export const commandData = commandList.map((command) => command.data.toJSON());
