import { EmbedBuilder } from "discord.js";
import { performHealthCheck, getSystemMetrics, getCommandMetrics } from "../utils/monitoring.js";
import { getSecurityStats, getUserSecurityInfo } from "../utils/security.js";
import { getAllConfig, updateConfig } from "../utils/config.js";

export default {
  name: "admin",
  description: "Advanced admin commands (Admin only)",
  async run({ message, args, client }) {
    // Check if user has admin permissions
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ You need Administrator permissions to use this command.");
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case "health":
        await showHealthCheck(message, client);
        break;
      
      case "metrics":
        await showMetrics(message);
        break;
      
      case "security":
        await showSecurity(message, args);
        break;
      
      case "config":
        await manageConfig(message, args);
        break;
      
      default:
        await showAdminHelp(message);
        break;
    }
  }
};

async function showHealthCheck(message, client) {
  const health = await performHealthCheck(client);
  
  const embed = new EmbedBuilder()
    .setTitle("🏥 System Health Check")
    .setColor(health.status === 'healthy' ? 0x00FF00 : health.status === 'warning' ? 0xFFAA00 : 0xFF0000)
    .addFields([
      { name: "Overall Status", value: `**${health.status.toUpperCase()}**`, inline: true },
      { name: "Timestamp", value: `<t:${Math.floor(health.timestamp.getTime() / 1000)}:R>`, inline: true }
    ]);

  // Add health checks
  for (const [checkName, check] of Object.entries(health.checks)) {
    const statusEmoji = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    embed.addFields([
      { name: `${statusEmoji} ${checkName}`, value: check.message, inline: true }
    ]);
  }

  await message.reply({ embeds: [embed] });
}

async function showMetrics(message) {
  const systemMetrics = getSystemMetrics();
  const commandMetrics = getCommandMetrics();
  
  const embed = new EmbedBuilder()
    .setTitle("📊 System Metrics")
    .setColor(0x0099FF)
    .addFields([
      { name: "⏱️ Uptime", value: systemMetrics.uptimeFormatted, inline: true },
      { name: "🎯 Commands Processed", value: systemMetrics.commandsProcessed.toString(), inline: true },
      { name: "❌ Error Rate", value: systemMetrics.errorRate, inline: true },
      { name: "⚡ Avg Response Time", value: `${systemMetrics.avgResponseTime}ms`, inline: true },
      { name: "🗄️ DB Queries", value: systemMetrics.dbQueries.toString(), inline: true },
      { name: "💾 Memory Usage", value: `${systemMetrics.memoryUsage.heapUsed}MB`, inline: true }
    ])
    .setTimestamp();

  // Add top commands
  if (commandMetrics.topCommands.length > 0) {
    const topCommandsText = commandMetrics.topCommands
      .slice(0, 5)
      .map(cmd => `**${cmd.command}**: ${cmd.executions} (${cmd.avgTime}ms avg)`)
      .join('\n');
    
    embed.addFields([
      { name: "🔥 Top Commands", value: topCommandsText, inline: false }
    ]);
  }

  await message.reply({ embeds: [embed] });
}

async function showSecurity(message, args) {
  const userId = args[1]?.replace(/[<@!>]/g, "");
  
  if (userId) {
    // Show specific user security info
    const userInfo = getUserSecurityInfo(userId);
    
    try {
      const user = await message.client.users.fetch(userId);
      
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Security Info: ${user.tag}`)
        .setColor(userInfo.riskLevel === 'low' ? 0x00FF00 : userInfo.riskLevel === 'medium' ? 0xFFAA00 : 0xFF0000)
        .addFields([
          { name: "Risk Level", value: `**${userInfo.riskLevel.toUpperCase()}**`, inline: true }
        ]);

      if (userInfo.suspicious) {
        embed.addFields([
          { name: "Suspicious Activities", value: userInfo.suspicious.count.toString(), inline: true },
          { name: "First Seen", value: `<t:${Math.floor(userInfo.suspicious.firstSeen / 1000)}:R>`, inline: true }
        ]);
        
        const flagTypes = [...new Set(userInfo.suspicious.flags.map(f => f.type))];
        if (flagTypes.length > 0) {
          embed.addFields([
            { name: "Flag Types", value: flagTypes.join(', '), inline: false }
          ]);
        }
      }

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply("❌ User not found or invalid user ID.");
    }
  } else {
    // Show overall security stats
    const securityStats = getSecurityStats();
    
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Security Overview")
      .setColor(0x0099FF)
      .addFields([
        { name: "👥 Tracked Users", value: securityStats.trackedUsers.toString(), inline: true },
        { name: "⚠️ Suspicious Users", value: securityStats.suspiciousUsers.toString(), inline: true },
        { name: "🚨 High Risk Users", value: securityStats.highRiskUsers.toString(), inline: true },
        { name: "📋 Total Events", value: securityStats.totalSecurityEvents.toString(), inline: true }
      ])
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
}

async function manageConfig(message, args) {
  const action = args[1]?.toLowerCase();
  
  if (action === 'show') {
    const config = getAllConfig();
    const configText = JSON.stringify(config, null, 2);
    
    // Split into chunks if too long
    if (configText.length > 1900) {
      await message.reply("⚙️ Configuration is too long for Discord. Check the config file directly.");
    } else {
      await message.reply(`\`\`\`json\n${configText}\`\`\``);
    }
  } else if (action === 'set') {
    const path = args[2];
    const value = args.slice(3).join(' ');
    
    if (!path || value === undefined) {
      await message.reply("❌ Usage: `!admin config set <path> <value>`\nExample: `!admin config set economy.dailyAmount 150`");
      return;
    }
    
    try {
      // Try to parse as number or boolean
      let parsedValue = value;
      if (!isNaN(value)) {
        parsedValue = Number(value);
      } else if (value === 'true' || value === 'false') {
        parsedValue = value === 'true';
      }
      
      updateConfig(path, parsedValue);
      await message.reply(`✅ Configuration updated: \`${path}\` = \`${parsedValue}\``);
    } catch (error) {
      await message.reply(`❌ Failed to update configuration: ${error.message}`);
    }
  } else {
    await message.reply("❌ Usage: `!admin config show` or `!admin config set <path> <value>`");
  }
}

async function showAdminHelp(message) {
  const embed = new EmbedBuilder()
    .setTitle("🛠️ Advanced Admin Commands")
    .setDescription("Manage bot systems and monitor performance")
    .setColor(0x0099FF)
    .addFields([
      { 
        name: "🏥 `!admin health`", 
        value: "Perform comprehensive health check", 
        inline: false 
      },
      { 
        name: "📊 `!admin metrics`", 
        value: "View system performance metrics", 
        inline: false 
      },
      { 
        name: "🛡️ `!admin security [user]`", 
        value: "View security overview or specific user info", 
        inline: false 
      },
      { 
        name: "⚙️ `!admin config show`", 
        value: "Show current configuration", 
        inline: false 
      },
      { 
        name: "⚙️ `!admin config set <path> <value>`", 
        value: "Update configuration value", 
        inline: false 
      }
    ])
    .setFooter({ text: "Admin only commands • Use with caution" });

  await message.reply({ embeds: [embed] });
}
