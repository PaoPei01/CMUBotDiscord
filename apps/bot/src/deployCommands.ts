import { REST, Routes } from "discord.js";

import { loadConfig } from "./config.js";
import { commandData } from "./services/commandRegistry.js";

const config = loadConfig();
const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

await rest.put(
  Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID),
  {
    body: commandData
  }
);

console.log(`Registered ${commandData.length} guild slash commands.`);
