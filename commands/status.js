import { EmbedBuilder } from "discord.js";
import { getSystemMetrics, getCommandMetrics } from "../utils/monitoring.js";
import { getRateLimitStats } from "../utils/rateLimiter.js";
import { getSecurityStats } from "../utils/security.js";
import { getLoggerStats } from "../utils/logger.js";

export default {
  name: "status",
  description: "Show bot status and statistics",
  async run({ message, client }) {
    try {
      const systemMetrics = getSystemMetrics();
      const rateLimitStats = getRateLimitStats();
      const securityStats = getSecurityStats();
      const loggerStats = getLoggerStats();
      const commandStats = getCommandMetrics();

      const embed = new EmbedBuilder()
        .setTitle("🤖 Bot Status & Statistics")
        .setColor(0x00AE86)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields([
          { 
            name: "⏱️ System", 
            value: `**Uptime:** ${systemMetrics.uptimeFormatted}\n**Memory:** ${systemMetrics.memoryUsage.heapUsed}MB\n**Commands:** ${systemMetrics.commandsProcessed}`, 
            inline: true 
          },
          { 
            name: "📊 Performance", 
            value: `**Avg Response:** ${systemMetrics.avgResponseTime}ms\n**Error Rate:** ${systemMetrics.errorRate}\n**DB Queries:** ${systemMetrics.dbQueries}`, 
            inline: true 
          },
          { 
            name: "🛡️ Security", 
            value: `**Tracked Users:** ${securityStats.trackedUsers}\n**Suspicious:** ${securityStats.suspiciousUsers}\n**High Risk:** ${securityStats.highRiskUsers}`, 
            inline: true 
          },
          { 
            name: "⚡ Rate Limiting", 
            value: `**Total Requests:** ${rateLimitStats.totalRequests}\n**Blocked:** ${rateLimitStats.blockedRequests}\n**Block Rate:** ${rateLimitStats.blockRate}`, 
            inline: true 
          },
          { 
            name: "📝 Logging", 
            value: `**Total Logs:** ${loggerStats.totalLogs}\n**Avg Time:** ${loggerStats.avgResponseTime}ms\n**Success Rate:** ${loggerStats.successRate}%`, 
            inline: true 
          },
          { 
            name: "🌐 Discord", 
            value: `**Guilds:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Ping:** ${client.ws.ping}ms`, 
            inline: true 
          }
        ]);

      // Add top commands if available
      if (commandStats.topCommands && commandStats.topCommands.length > 0) {
        const topCommandsText = commandStats.topCommands
          .slice(0, 5)
          .map(cmd => `**${cmd.command}**: ${cmd.executions} uses`)
          .join('\n');
        
        embed.addFields([
          { name: "🔥 Top Commands", value: topCommandsText, inline: false }
        ]);
      }

      embed.setTimestamp();
      embed.setFooter({ text: "Real-time bot statistics" });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Status command error:", error);
      await message.reply("❌ An error occurred while fetching bot status.");
    }
  }
};
