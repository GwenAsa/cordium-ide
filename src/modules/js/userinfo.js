const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a member")
    .addUserOption((o) => o.setName("member").setDescription("Member to inspect (default: you)")),
  async execute(interaction) {
    const user = interaction.options.getUser("member") ?? interaction.user;
    const embed = new EmbedBuilder()
      .setTitle(user.tag)
      .setColor(0x5865f2)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "ID", value: user.id, inline: true },
        { name: "Account created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
