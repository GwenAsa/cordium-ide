import { hoverTooltip } from "@codemirror/view";

const D = {
  send_message: ["await interaction.response.send_message(content=None, *, embed=None, view=None, ephemeral=False)", "Replies to a slash command. Must happen within 3 seconds; for slow work call defer() first."],
  defer: ["await interaction.response.defer(ephemeral=False)", "Acknowledges the interaction so you get 15 minutes to answer with followup.send()."],
  edit_message: ["await interaction.response.edit_message(content=None, embed=None, view=None)", "Edits the message a button or select menu is attached to."],
  send_modal: ["await interaction.response.send_modal(modal)", "Opens a pop-up form (discord.ui.Modal) for the user."],
  followup: ["interaction.followup.send(content, *, embed=None, ephemeral=False)", "Sends extra messages after the first response or after defer()."],
  Embed: ["discord.Embed(title=None, description=None, color=None, url=None)", "A rich message card. Add fields with add_field() and a footer with set_footer()."],
  add_field: ["embed.add_field(name, value, inline=True)", "Adds a titled field to an embed. Max 25 fields."],
  set_footer: ["embed.set_footer(text, icon_url=None)", "Small text at the bottom of an embed."],
  set_thumbnail: ["embed.set_thumbnail(url)", "Small image at the top right of an embed."],
  set_image: ["embed.set_image(url)", "Large image at the bottom of an embed."],
  set_author: ["embed.set_author(name, url=None, icon_url=None)", "Author line above the embed title."],
  Intents: ["discord.Intents.default() / .none() / .all()", "Which events your bot receives. Members, Presences and Message Content are privileged and must also be enabled in the Developer Portal."],
  message_content: ["intents.message_content = True", "Needed to read the text of normal messages (prefix commands, on_message)."],
  members: ["intents.members = True", "Needed for member join/leave events and the full member list. Privileged intent."],
  Cog: ["class MyCog(commands.Cog)", "A group of commands and listeners in one class. Load it with bot.add_cog() inside async def setup(bot)."],
  Bot: ["commands.Bot(command_prefix, intents=...)", "The bot object: a Client with prefix commands, cogs and a command tree for slash commands."],
  command: ["@app_commands.command(name=..., description=...)", "Registers a slash command. Run 'await bot.tree.sync()' once so Discord shows it."],
  describe: ["@app_commands.describe(param='text')", "Adds a description to each slash command parameter."],
  choices: ["@app_commands.choices(param=[Choice(name=..., value=...)])", "Gives a parameter a fixed list of choices."],
  has_permissions: ["@app_commands.checks.has_permissions(kick_members=True)", "Only lets users with these permissions run the command."],
  cooldown: ["@app_commands.checks.cooldown(rate, per)", "Limits how often a command can be used."],
  guild_only: ["@app_commands.guild_only()", "Disables the command in DMs."],
  loop: ["@tasks.loop(seconds=..., minutes=..., hours=...)", "Runs a coroutine repeatedly in the background. Start it with .start()."],
  listener: ["@commands.Cog.listener()", "Marks a cog method as an event handler, e.g. on_member_join."],
  load_extension: ["await bot.load_extension('cogs.name')", "Loads a cog file that defines async def setup(bot)."],
  add_cog: ["await bot.add_cog(MyCog(bot))", "Registers a cog; call it from setup()."],
  tree: ["bot.tree", "The CommandTree holding all slash commands. Use bot.tree.sync() to publish them."],
  sync: ["await bot.tree.sync(guild=None)", "Publishes slash commands. Global sync can take up to an hour; pass a guild for instant updates while testing."],
  change_presence: ["await bot.change_presence(activity=discord.Game('...'))", "Sets the bot's status and activity text."],
  latency: ["bot.latency", "Gateway latency in seconds (nan before the bot connects)."],
  ephemeral: ["ephemeral=True", "Only the user who ran the command can see this reply."],
  timeout: ["await member.timeout(timedelta, reason=None)", "Temporarily mutes a member. Needs Moderate Members permission."],
  purge: ["await channel.purge(limit=100)", "Bulk-deletes recent messages. Needs Manage Messages."],
  display_avatar: ["member.display_avatar.url", "The avatar the member currently shows in this server."],
  format_dt: ["discord.utils.format_dt(datetime, style='f')", "Formats a time as a Discord timestamp. Style 'R' gives 'x minutes ago'."],
  reply: ["await interaction.reply(content | { content, embeds, components, ephemeral })", "Answers a slash command or message. Must be called within 3 seconds, otherwise use deferReply() first."],
  deferReply: ["await interaction.deferReply({ ephemeral })", "Buys time (15 minutes) for slow commands; finish with editReply()."],
  editReply: ["await interaction.editReply(content | options)", "Edits the reply after reply() or deferReply()."],
  followUp: ["await interaction.followUp(content | options)", "Sends an extra message after the first reply."],
  EmbedBuilder: ["new EmbedBuilder().setTitle().setDescription().setColor().addFields()", "Builds a rich embed card."],
  SlashCommandBuilder: ["new SlashCommandBuilder().setName().setDescription()", "Defines a slash command and its options."],
  setRequired: ["option.setRequired(true)", "Makes a slash command option mandatory."],
  GatewayIntentBits: ["GatewayIntentBits.Guilds | GuildMembers | GuildMessages | MessageContent", "Which events your bot receives. GuildMembers, GuildPresences and MessageContent are privileged."],
  Events: ["Events.ClientReady | InteractionCreate | MessageCreate | GuildMemberAdd", "Names of the events you can listen to with client.on()."],
  PermissionFlagsBits: ["PermissionFlagsBits.Administrator | KickMembers | BanMembers ...", "Permission flags for checks and setDefaultMemberPermissions()."],
  setDefaultMemberPermissions: ["builder.setDefaultMemberPermissions(PermissionFlagsBits.X)", "Hides the command from members without this permission."],
  ActionRowBuilder: ["new ActionRowBuilder().addComponents(...)", "A row that holds buttons or one select menu."],
  ButtonBuilder: ["new ButtonBuilder().setCustomId().setLabel().setStyle()", "A clickable button. Handle it with interaction.isButton()."],
  StringSelectMenuBuilder: ["new StringSelectMenuBuilder().setCustomId().addOptions(...)", "A drop-down menu. Handle it with interaction.isStringSelectMenu()."],
  ModalBuilder: ["new ModalBuilder().setCustomId().setTitle()", "A pop-up form. Show it with interaction.showModal()."],
  getString: ["interaction.options.getString(name)", "Reads a text option of the slash command."],
  getInteger: ["interaction.options.getInteger(name)", "Reads a whole-number option of the slash command."],
  getUser: ["interaction.options.getUser(name)", "Reads a user option."],
  getMember: ["interaction.options.getMember(name)", "Reads a guild member option (null outside servers)."],
  bulkDelete: ["await channel.bulkDelete(amount, filterOld)", "Deletes up to 100 recent messages (not older than 14 days)."],
  displayAvatarURL: ["user.displayAvatarURL()", "URL of the user's current avatar."],
};

export const staticDoc = (w) => D[w];

export const docHover = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos), col = pos - line.from;
  const re = /[A-Za-z_$][\w$]*/g;
  let m, hit = null;
  while ((m = re.exec(line.text))) { if (m.index <= col && col <= m.index + m[0].length) { hit = m; break; } }
  if (!hit || !D[hit[0]]) return null;
  const d = D[hit[0]];
  return {
    pos: line.from + hit.index, end: line.from + hit.index + hit[0].length, above: true,
    create() {
      const dom = document.createElement("div");
      dom.className = "hoverdoc";
      const c = document.createElement("code"); c.textContent = d[0];
      const p = document.createElement("div"); p.textContent = d[1];
      dom.append(c, p);
      return { dom };
    },
  };
});
