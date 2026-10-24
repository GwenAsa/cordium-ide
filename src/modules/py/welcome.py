import discord
from discord.ext import commands


class Welcome(commands.Cog):
    """Greets new members in the server's system channel.

    Needs: intents.members = True in main.py, and the Server Members
    intent enabled in the Discord Developer Portal.
    """

    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        channel = member.guild.system_channel
        if channel is None:
            return
        embed = discord.Embed(
            title=f"Welcome, {member.display_name}!",
            description=f"Glad to have you in {member.guild.name}. You are member #{member.guild.member_count}.",
            color=discord.Color.green(),
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        await channel.send(embed=embed)


async def setup(bot):
    await bot.add_cog(Welcome(bot))
