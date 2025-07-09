import { EmbedBuilder } from "discord.js";
import { ACHIEVEMENTS } from "../utils/economy.js";

export default {
  name: "achievements",
  description: "View your achievements and progress",
  async run({ message, users, userData }) {
    try {
      const userAchievements = userData.achievements || [];
      const totalAchievements = Object.keys(ACHIEVEMENTS).length;
      const completedCount = userAchievements.length;
      
      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${message.author.username}'s Achievements`)
        .setDescription(`**${completedCount}/${totalAchievements}** achievements unlocked`)
        .setColor(0xFFD700)
        .setThumbnail(message.author.displayAvatarURL());

      // Show completed achievements
      if (userAchievements.length > 0) {
        const completedText = Object.values(ACHIEVEMENTS)
          .filter(achievement => userAchievements.includes(achievement.id))
          .map(achievement => `✅ **${achievement.name}**\n${achievement.description}`)
          .join('\n\n');
        
        embed.addFields([
          { name: "🎉 Completed", value: completedText || "None", inline: false }
        ]);
      }

      // Show available achievements
      const availableAchievements = Object.values(ACHIEVEMENTS)
        .filter(achievement => !userAchievements.includes(achievement.id))
        .slice(0, 5); // Show first 5 incomplete

      if (availableAchievements.length > 0) {
        const availableText = availableAchievements
          .map(achievement => `🔒 **${achievement.name}** (+${achievement.reward} coins)\n${achievement.description}`)
          .join('\n\n');
        
        embed.addFields([
          { name: "🎯 Available", value: availableText, inline: false }
        ]);
      }

      // Progress indicators
      const progressText = [];
      
      // Work progress
      const workCount = userData.workCount || 0;
      const workNeeded = 100;
      if (workCount < workNeeded && !userAchievements.includes('hard_worker')) {
        progressText.push(`💼 Work Progress: ${workCount}/${workNeeded}`);
      }
      
      // Daily streak progress
      const dailyStreak = userData.dailyStreak || 0;
      if (dailyStreak < 30) {
        const nextMilestone = dailyStreak < 7 ? 7 : 30;
        progressText.push(`🔥 Daily Streak: ${dailyStreak}/${nextMilestone} days`);
      }
      
      // Wealth progress
      const totalWealth = (userData.coins || 0) + (userData.bank || 0);
      if (totalWealth < 1000000) {
        const nextMilestone = totalWealth < 10000 ? 10000 : 1000000;
        progressText.push(`💰 Wealth: ${totalWealth.toLocaleString()}/${nextMilestone.toLocaleString()}`);
      }

      if (progressText.length > 0) {
        embed.addFields([
          { name: "📊 Progress", value: progressText.join('\n'), inline: false }
        ]);
      }

      embed.setFooter({ text: "Keep playing to unlock more achievements!" });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Achievement command error:", error);
      await message.reply("❌ An error occurred while fetching your achievements.");
    }
  }
};
