import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';
import { getConfig } from '../utils/config.js';
import { checkAchievements, calculateDailyStreak, calculateStreakBonus } from '../utils/economy.js';
import { trackUserActivity, validateTransaction } from '../utils/security.js';

export default {
  name: 'daily',
  run: async ({ message, users, userData }) => {
    try { // Log: Wrap logic in try/catch for error logging
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;

      const remaining = cooldown - (now - (userData.lastDaily || 0));
      const formatTime = (ms) => {
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h ${minutes}m`;
      };

      if (remaining > 0) {
        // Log: User tried daily but is on cooldown
        logWarn(message.client, `User ${message.author.tag} tried !daily but is on cooldown (${formatTime(remaining)} left)`);
        const embed = new EmbedBuilder()
          .setTitle(`⏳ Daily Reward Cooldown`)
          .setDescription(`You already claimed your daily!\nTry again in **${formatTime(remaining)}**.`)
          .setColor(0xFF0000);

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('open_profile')
            .setLabel('👤 Profile')
            .setStyle(ButtonStyle.Secondary)
        );

        return message.reply({ embeds: [embed], components: [buttons] });
      }

      const baseReward = getConfig('economy.dailyAmount') || 100;
      const randomBonus = Math.floor(Math.random() * 100); // 0-99 bonus
      const streak = calculateDailyStreak(userData);
      const streakBonus = calculateStreakBonus(streak, baseReward);
      const totalReward = baseReward + randomBonus + streakBonus;

      // Validate transaction
      const validation = validateTransaction(userData.userId, 'earn', totalReward, userData);
      if (!validation.valid) {
        logWarn(message.client, `Daily transaction validation failed for ${message.author.tag}: ${validation.errors.join(', ')}`);
        return message.reply('❌ Transaction failed validation. Please try again later.');
      }

      // Track activity for security
      trackUserActivity(userData.userId, 'daily_claim', totalReward);

      // Log: User successfully claimed daily
      logInfo(message.client, `User ${message.author.tag} claimed daily and received ${totalReward} coins (streak: ${streak})`, {
        userId: userData.userId,
        reward: totalReward,
        streak: streak,
        action: 'daily_claimed'
      });

      // Update user data
      const updateData = {
        $inc: {
          coins: totalReward,
          lifetimeEarned: totalReward
        },
        $set: { 
          lastDaily: now,
          dailyStreak: streak
        }
      };

      await users.updateOne({ userId: userData.userId }, updateData);

      // Check for achievements
      const newUserData = { ...userData, coins: userData.coins + totalReward, dailyStreak: streak };
      const achievements = await checkAchievements(users, userData.userId, newUserData, message.client);

      let achievementText = '';
      if (achievements.length > 0) {
        achievementText = `\n\n🏆 **Achievements Unlocked:**\n${achievements.map(a => `• ${a.name} (+${a.reward} coins)`).join('\n')}`;
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎁 Daily Reward Claimed!`)
        .setDescription(`You got **💰 ${totalReward} coins!**\n\n` +
          `🎯 Base: ${baseReward} | 🎰 Bonus: ${randomBonus}` +
          (streakBonus > 0 ? ` | 🔥 Streak: ${streakBonus}` : '') +
          `\n🔥 Daily Streak: **${streak} days**` +
          achievementText)
        .setColor(0x00AE86);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_profile')
          .setLabel('👤 Profile')
          .setStyle(ButtonStyle.Primary)
      );

      await message.reply({ embeds: [embed], components: [buttons] });
    } catch (err) {
      // Log: Error occurred in daily command
      logError(message.client, `Error in !daily command for ${message.author.tag}: ${err}`);
      await message.reply('❌ An error occurred while processing your daily command.');
    }
  },
};