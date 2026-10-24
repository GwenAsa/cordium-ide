import { snippetCompletion as sc } from "@codemirror/autocomplete";

const PY = [
  ["slash", "slash command", 'import discord\nfrom discord import app_commands\n\n@app_commands.command(name="${name}", description="${description}")\nasync def ${name}(self, interaction: discord.Interaction):\n    await interaction.response.send_message("${message}")'],
  ["cog", "cog class", 'class ${Name}(commands.Cog):\n    def __init__(self, bot):\n        self.bot = bot\n\n    ${}\n\n\nasync def setup(bot):\n    await bot.add_cog(${Name}(bot))'],
  ["listener", "event listener", '@commands.Cog.listener()\nasync def on_${member_join}(self, ${member}):\n    ${}'],
  ["embed", "embed", 'embed = discord.Embed(title="${title}", description="${description}", color=0x5865F2)\nembed.add_field(name="${name}", value="${value}", inline=True)\nembed.set_footer(text="${footer}")'],
  ["button", "button view", 'class ${Name}View(discord.ui.View):\n    @discord.ui.button(label="${Click}", style=discord.ButtonStyle.primary)\n    async def on_click(self, interaction: discord.Interaction, button: discord.ui.Button):\n        await interaction.response.send_message("${Clicked}", ephemeral=True)'],
  ["loop", "background task", '@tasks.loop(minutes=${5})\nasync def ${task_name}(self):\n    ${}'],
  ["perm", "permission check", '@app_commands.checks.has_permissions(${manage_messages}=True)'],
  ["error", "command error handler", 'async def cog_app_command_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):\n    await interaction.response.send_message(f"Error: {error}", ephemeral=True)'],
];
const JS = [
  ["slash", "slash command file", 'const { SlashCommandBuilder } = require("discord.js");\n\nmodule.exports = {\n  data: new SlashCommandBuilder().setName("${name}").setDescription("${description}"),\n  async execute(interaction) {\n    await interaction.reply("${message}");\n  },\n};'],
  ["event", "event listener", 'client.on(Events.${MessageCreate}, async (${message}) => {\n  ${}\n});'],
  ["embed", "embed", 'const embed = new EmbedBuilder()\n  .setTitle("${title}")\n  .setDescription("${description}")\n  .setColor(0x5865f2)\n  .addFields({ name: "${name}", value: "${value}", inline: true })\n  .setFooter({ text: "${footer}" });'],
  ["button", "button row", 'const row = new ActionRowBuilder().addComponents(\n  new ButtonBuilder().setCustomId("${id}").setLabel("${Click}").setStyle(ButtonStyle.Primary)\n);'],
  ["defer", "defer + edit reply", 'await interaction.deferReply();\n${}\nawait interaction.editReply("${done}");'],
  ["perm", "permission check", 'if (!interaction.member.permissions.has(PermissionFlagsBits.${ManageMessages})) {\n  return interaction.reply({ content: "No permission.", ephemeral: true });\n}'],
];

export const loadCustom = () => { try { return JSON.parse(localStorage.getItem("cordium.snips") || "[]"); } catch { return []; } };
export const saveCustom = (list) => localStorage.setItem("cordium.snips", JSON.stringify(list));

export function snippetSource(lang) {
  const built = (lang === "py" ? PY : JS).map(([label, detail, body]) => sc(body, { label, detail, type: "snippet", boost: 5 }));
  return (context) => {
    const custom = loadCustom().filter((c) => c.lang === lang || c.lang === "both").map((c) => sc(c.body, { label: c.trigger, detail: "my snippet", type: "snippet", boost: 8 }));
    const options = [...custom, ...built];
    const word = context.matchBefore(/[\w]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return { from: word.from, options, validFor: /^\w*$/ };
  };
}
