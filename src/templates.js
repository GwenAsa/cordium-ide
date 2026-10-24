export const PY_TEMPLATE = {
  "main.py": `import os
import asyncio
import discord
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"Logged in as {bot.user} (id: {bot.user.id})")


async def main():
    async with bot:
        for name in os.listdir("cogs"):
            if name.endswith(".py"):
                await bot.load_extension(f"cogs.{name[:-3]}")
        await bot.start(os.getenv("DISCORD_TOKEN"))


if __name__ == "__main__":
    asyncio.run(main())
`,
  "cogs/general.py": `import discord
from discord import app_commands
from discord.ext import commands


class General(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="ping", description="Show the bot latency")
    async def ping(self, interaction: discord.Interaction):
        ms = round(self.bot.latency * 1000)
        await interaction.response.send_message(f"Pong! {ms}ms")


async def setup(bot):
    await bot.add_cog(General(bot))
`,
  ".env": "DISCORD_TOKEN=your-token-here\n",
  "requirements.txt": "discord.py>=2.4\npython-dotenv\n",
};

export const JS_TEMPLATE = {
  "index.js": `const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const dir = path.join(__dirname, "commands");
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  const command = require(path.join(dir, file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (c) => console.log("Logged in as " + c.user.tag));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (command) await command.execute(interaction);
});

client.login(process.env.DISCORD_TOKEN);
`,
  "commands/ping.js": `const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Show the bot latency"),
  async execute(interaction) {
    await interaction.reply("Pong! " + interaction.client.ws.ping + "ms");
  },
};
`,
  ".env": "DISCORD_TOKEN=your-token-here\n",
  "package.json": `{
  "name": "my-discord-bot",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node --env-file=.env index.js" },
  "dependencies": { "discord.js": "^14.16.0" }
}
`,
};
