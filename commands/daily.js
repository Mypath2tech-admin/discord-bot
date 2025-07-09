import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';

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

      const reward = Math.floor(Math.random() * 200) + 100;

      // Log: User successfully claimed daily
      logInfo(message.client, `User ${message.author.tag} claimed daily and received ${reward} coins`);

      await users.updateOne(
        { userId: userData.userId },
        {
          $inc: {
            coins: reward,
            lifetimeEarned: reward
          },
          $set: { lastDaily: now }
        }
      );

      const embed = new EmbedBuilder()
        .setTitle(`🎁 Daily Reward Claimed!`)
        .setDescription(`You got **💰 ${reward} coins!**`)
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