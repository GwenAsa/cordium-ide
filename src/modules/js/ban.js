const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption((o) => o.setName("member").setDescription("Member to ban").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Why are you banning them?"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("member");
    const reason = interaction.options.getString("reason") ?? "No reason given";
    await interaction.guild.members.ban(user, { reason });
    await interaction.reply(`Banned ${user.tag}: ${reason}`);
  },
};
