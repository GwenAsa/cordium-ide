import datetime

import discord
from discord import app_commands
from discord.ext import commands


class Moderation(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="kick", description="Kick a member from the server")
    @app_commands.describe(member="Member to kick", reason="Why are you kicking them?")
    @app_commands.checks.has_permissions(kick_members=True)
    async def kick(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason given"):
        await member.kick(reason=reason)
        await interaction.response.send_message(f"Kicked {member.mention}: {reason}")

    @app_commands.command(name="ban", description="Ban a member from the server")
    @app_commands.describe(member="Member to ban", reason="Why are you banning them?")
    @app_commands.checks.has_permissions(ban_members=True)
    async def ban(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason given"):
        await member.ban(reason=reason)
        await interaction.response.send_message(f"Banned {member.mention}: {reason}")

    @app_commands.command(name="timeout", description="Timeout a member for some minutes")
    @app_commands.describe(member="Member to timeout", minutes="How long (1-40320)", reason="Reason")
    @app_commands.checks.has_permissions(moderate_members=True)
    async def timeout(self, interaction: discord.Interaction, member: discord.Member,
                      minutes: app_commands.Range[int, 1, 40320], reason: str = "No reason given"):
        await member.timeout(datetime.timedelta(minutes=minutes), reason=reason)
        await interaction.response.send_message(f"{member.mention} timed out for {minutes} minutes")

    @app_commands.command(name="purge", description="Delete the latest messages in this channel")
    @app_commands.describe(amount="How many messages (1-100)")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def purge(self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100]):
        await interaction.response.defer(ephemeral=True)
        deleted = await interaction.channel.purge(limit=amount)
        await interaction.followup.send(f"Deleted {len(deleted)} messages", ephemeral=True)


async def setup(bot):
    await bot.add_cog(Moderation(bot))
