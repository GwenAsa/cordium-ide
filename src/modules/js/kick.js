const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .addUserOption((o) => o.setName("member").setDescription("Member to kick").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Why are you kicking them?"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const reason = interaction.options.getString("reason") ?? "No reason given";
    await member.kick(reason);
    await interaction.reply(`Kicked ${member.user.tag}: ${reason}`);
  },
};
