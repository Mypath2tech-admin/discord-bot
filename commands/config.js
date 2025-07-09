import { EmbedBuilder } from "discord.js";
import { getAllConfig, getConfig, updateConfig } from "../utils/config.js";

export default {
  name: "config",
  description: "Manage bot configuration (Admin only)",
  async run({ message, args }) {
    // Check if user has admin permissions
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ You need Administrator permissions to use this command.");
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case "show":
        await showConfig(message, args[1]);
        break;
      
      case "set":
        await setConfig(message, args.slice(1));
        break;
      
      case "get":
        await getConfigValue(message, args[1]);
        break;
      
      default:
        await showConfigHelp(message);
        break;
    }
  }
};

async function showConfig(message, section) {
  try {
    const config = getAllConfig();
    
    if (section) {
      const sectionConfig = getConfig(section);
      if (sectionConfig === undefined) {
        return message.reply(`❌ Configuration section '${section}' not found.`);
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`⚙️ Configuration: ${section}`)
        .setDescription(`\`\`\`json\n${JSON.stringify(sectionConfig, null, 2)}\`\`\``)
        .setColor(0x0099FF);
      
      await message.reply({ embeds: [embed] });
    } else {
      // Show all sections
      const embed = new EmbedBuilder()
        .setTitle("⚙️ Bot Configuration")
        .setColor(0x0099FF)
        .setDescription("Available configuration sections:");
      
      const sections = Object.keys(config);
      sections.forEach(section => {
        const values = Object.entries(config[section])
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('\n');
        
        embed.addFields([
          { name: `📁 ${section}`, value: `\`\`\`${values}\`\`\``, inline: false }
        ]);
      });
      
      await message.reply({ embeds: [embed] });
    }
  } catch (error) {
    await message.reply(`❌ Error displaying configuration: ${error.message}`);
  }
}

async function setConfig(message, args) {
  const path = args[0];
  const value = args.slice(1).join(' ');
  
  if (!path || value === undefined) {
    return message.reply("❌ Usage: `!config set <path> <value>`\nExample: `!config set economy.dailyAmount 150`");
  }
  
  try {
    // Try to parse as number or boolean
    let parsedValue = value;
    if (!isNaN(value) && value !== '') {
      parsedValue = Number(value);
    } else if (value === 'true' || value === 'false') {
      parsedValue = value === 'true';
    }
    
    updateConfig(path, parsedValue);
    
    const embed = new EmbedBuilder()
      .setTitle("✅ Configuration Updated")
      .setDescription(`**${path}** = \`${parsedValue}\``)
      .setColor(0x00FF00)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply(`❌ Failed to update configuration: ${error.message}`);
  }
}

async function getConfigValue(message, path) {
  if (!path) {
    return message.reply("❌ Usage: `!config get <path>`\nExample: `!config get economy.dailyAmount`");
  }
  
  try {
    const value = getConfig(path);
    
    if (value === undefined) {
      return message.reply(`❌ Configuration path '${path}' not found.`);
    }
    
    const embed = new EmbedBuilder()
      .setTitle("📋 Configuration Value")
      .setDescription(`**${path}** = \`${JSON.stringify(value)}\``)
      .setColor(0x0099FF);
    
    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply(`❌ Error getting configuration: ${error.message}`);
  }
}

async function showConfigHelp(message) {
  const embed = new EmbedBuilder()
    .setTitle("⚙️ Configuration Commands")
    .setDescription("Manage bot configuration settings")
    .setColor(0x0099FF)
    .addFields([
      { 
        name: "📋 `!config show [section]`", 
        value: "Show all config or specific section", 
        inline: false 
      },
      { 
        name: "📝 `!config set <path> <value>`", 
        value: "Update a configuration value", 
        inline: false 
      },
      { 
        name: "🔍 `!config get <path>`", 
        value: "Get a specific configuration value", 
        inline: false 
      }
    ])
    .addFields([
      {
        name: "📚 Examples",
        value: "```!config show economy\n!config set economy.dailyAmount 150\n!config get features.enableRobbing```",
        inline: false
      }
    ])
    .setFooter({ text: "Admin only • Changes are saved automatically" });

  await message.reply({ embeds: [embed] });
}
