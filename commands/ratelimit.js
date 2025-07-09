import { EmbedBuilder } from "discord.js";
import {
  getRateLimitStats,
  resetUserRateLimit,
  getUserRateLimitInfo,
} from "../utils/rateLimiter.js";

export default {
  name: "ratelimit",
  description: "Manage rate limiting (Admin only)",
  async run({ message, args, client }) {
    // Check if user has admin permissions
    if (!message.member.permissions.has("Administrator")) {
      return message.reply(
        "❌ You need Administrator permissions to use this command."
      );
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case "stats":
        await showRateLimitStats(message);
        break;

      case "reset":
        await resetUserLimits(message, args, client);
        break;

      case "info":
        await showUserInfo(message, args);
        break;

      default:
        await showHelp(message);
        break;
    }
  },
};

async function showRateLimitStats(message) {
  const stats = getRateLimitStats();

  const embed = new EmbedBuilder()
    .setTitle("📊 Rate Limiting Statistics")
    .setColor(0x00ae86)
    .addFields([
      {
        name: "Total Requests",
        value: stats.totalRequests.toString(),
        inline: true,
      },
      {
        name: "Blocked Requests",
        value: stats.blockedRequests.toString(),
        inline: true,
      },
      { name: "Block Rate", value: stats.blockRate, inline: true },
      {
        name: "Unique Users",
        value: stats.uniqueUsers.toString(),
        inline: true,
      },
      {
        name: "Active Rate Limits",
        value: stats.activeUsers.toString(),
        inline: true,
      },
      {
        name: "Blocked Users",
        value: stats.blockedUsers.toString(),
        inline: true,
      },
    ])
    .setTimestamp()
    .setFooter({ text: "Rate Limiter Status" });

  await message.reply({ embeds: [embed] });
}

async function resetUserLimits(message, args, client) {
  const userId = args[1]?.replace(/[<@!>]/g, "");

  if (!userId) {
    return message.reply(
      "❌ Please provide a user ID or mention. Usage: `!ratelimit reset @user`"
    );
  }

  try {
    const user = await client.users.fetch(userId);
    resetUserRateLimit(userId, client);

    const embed = new EmbedBuilder()
      .setTitle("✅ Rate Limits Reset")
      .setDescription(`Rate limits have been reset for ${user.tag}`)
      .setColor(0x00ff00)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply("❌ User not found or invalid user ID.");
  }
}

async function showUserInfo(message, args) {
  const userId = args[1]?.replace(/[<@!>]/g, "") || message.author.id;

  try {
    const user = await message.client.users.fetch(userId);
    const info = getUserRateLimitInfo(userId);

    const embed = new EmbedBuilder()
      .setTitle(`📋 Rate Limit Info for ${user.tag}`)
      .setColor(info.blocked ? 0xff0000 : 0x00ae86)
      .setThumbnail(user.displayAvatarURL());

    if (info.blocked) {
      embed.addFields([
        { name: "🚫 Status", value: "**BLOCKED**", inline: true },
      ]);
    } else {
      embed.addFields([{ name: "✅ Status", value: "Active", inline: true }]);
    }

    if (info.globalLimit) {
      const resetTime = new Date(info.globalLimit.resetTime);
      embed.addFields([
        {
          name: "Global Requests",
          value: `${info.globalLimit.count}/20`,
          inline: true,
        },
        {
          name: "Global Reset",
          value: `<t:${Math.floor(resetTime.getTime() / 1000)}:R>`,
          inline: true,
        },
      ]);
    }

    if (Object.keys(info.commandLimits).length > 0) {
      const commandInfo = Object.entries(info.commandLimits)
        .slice(0, 5) // Show only first 5 commands
        .map(([cmd, data]) => {
          const resetTime = Math.floor(data.resetTime / 1000);
          return `**${cmd}**: ${data.count} uses, resets <t:${resetTime}:R>`;
        })
        .join("\n");

      embed.addFields([
        {
          name: "Recent Commands",
          value: commandInfo || "None",
          inline: false,
        },
      ]);
    }

    embed.setTimestamp();
    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply("❌ User not found or invalid user ID.");
  }
}

async function showHelp(message) {
  const embed = new EmbedBuilder()
    .setTitle("📖 Rate Limit Commands")
    .setDescription("Manage the bot's rate limiting system")
    .setColor(0x0099ff)
    .addFields([
      {
        name: "📊 `!ratelimit stats`",
        value: "Show overall rate limiting statistics",
        inline: false,
      },
      {
        name: "🔄 `!ratelimit reset @user`",
        value: "Reset rate limits for a specific user",
        inline: false,
      },
      {
        name: "📋 `!ratelimit info [@user]`",
        value: "Show rate limit info for a user (defaults to yourself)",
        inline: false,
      },
    ])
    .setFooter({ text: "Admin only commands" });

  await message.reply({ embeds: [embed] });
}
