// Completion data for discord.py and discord.js. Key = object before the dot.
const PY = {
  "discord": ["Intents", "Embed", "Color", "Member", "User", "Guild", "TextChannel", "Message", "Interaction", "Permissions", "Status", "Activity", "ButtonStyle", "File", "Object", "utils", "ui", "app_commands", "Client"],
  "commands": ["Bot", "Cog", "command", "hybrid_command", "has_permissions", "has_role", "cooldown", "check", "Context", "is_owner", "guild_only"],
  "app_commands": ["CommandTree", "command", "describe", "choices", "Choice", "checks", "Group", "guild_only"],
  "bot": ["run", "tree", "user", "guilds", "latency", "add_cog", "load_extension", "get_channel", "get_guild", "fetch_user", "change_presence", "wait_until_ready", "close"],
  "interaction": ["response", "user", "guild", "channel", "followup", "data", "command"],
  "response": ["send_message", "defer", "edit_message", "send_modal"],
  "ctx": ["send", "author", "guild", "channel", "message", "reply", "defer", "typing"],
  "tasks": ["loop"],
  "embed": ["add_field", "set_footer", "set_author", "set_thumbnail", "set_image", "title", "description", "color"],
};
const JS = {
  "client": ["on", "once", "login", "user", "guilds", "channels", "commands", "destroy", "application"],
  "interaction": ["reply", "deferReply", "editReply", "followUp", "user", "member", "guild", "channel", "options", "commandName", "isChatInputCommand", "isButton"],
  "options": ["getString", "getInteger", "getBoolean", "getUser", "getMember", "getChannel", "getRole", "getNumber"],
  "GatewayIntentBits": ["Guilds", "GuildMembers", "GuildMessages", "MessageContent", "GuildVoiceStates", "DirectMessages"],
  "Events": ["ClientReady", "InteractionCreate", "MessageCreate", "GuildMemberAdd", "GuildMemberRemove"],
  "PermissionFlagsBits": ["Administrator", "ManageMessages", "BanMembers", "KickMembers", "ManageRoles", "SendMessages"],
  "message": ["reply", "content", "author", "channel", "guild", "delete", "react"],
};
const WORDS = {
  py: ["discord", "commands", "app_commands", "tasks", "bot", "interaction", "ctx", "embed", "async def", "await", "@bot.event", "@bot.command()", "@app_commands.command", "on_ready", "on_message", "on_member_join", "setup"],
  js: ["client", "interaction", "EmbedBuilder", "SlashCommandBuilder", "GatewayIntentBits", "Events", "ActionRowBuilder", "ButtonBuilder", "PermissionFlagsBits", "require", "module.exports", "async", "await"],
};

export function discordCompletions(lang) {
  const table = lang === "py" ? PY : JS;
  return (context) => {
    const dot = context.matchBefore(/[\w$]+\.[\w$]*/);
    if (dot) {
      const [obj, partial] = dot.text.split(".");
      const items = table[obj];
      if (!items) return null;
      return {
        from: dot.from + obj.length + 1,
        options: items.map((label) => ({ label, type: "method", detail: obj })),
        validFor: /^[\w$]*$/,
      };
    }
    const word = context.matchBefore(/[@\w$]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return {
      from: word.from,
      options: WORDS[lang].map((label) => ({ label, type: "keyword", detail: "discord" })),
      validFor: /^[@\w$]*$/,
    };
  };
}
