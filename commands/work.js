import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';

export default {
  name: 'work',
  description: 'Earn coins by working (1-hour cooldown)',
  run: async ({ message, users, userData }) => {
    try {
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // 1 hour

    const remaining = cooldown - (now - (userData.lastWork || 0));
    const formatTime = (ms) => {
      const m = Math.floor(ms / (60 * 1000));
      const s = Math.floor((ms % (60 * 1000)) / 1000);
      return `${m}m ${s}s`;
    };

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('daily')
        .setLabel('🎁 Daily')
        .setStyle(ButtonStyle.Secondary)
    );

// Log Cooldown Attempt
    if (remaining > 0) {
  logWarn(message.client, `User ${message.author.tag} tried !work but is on cooldown (${formatTime(remaining)} left)`);
  const embed = new EmbedBuilder()
    .setTitle('⏳ Work Cooldown')
    .setDescription(`You need to wait **${formatTime(remaining)}** before working again.`)
    .setColor(0xFF0000);

  return message.reply({ embeds: [embed], components: [buttons] });
}

// Log Work Completion
    const earned = Math.floor(Math.random() * 100) + 50;
    logInfo(message.client, `User ${message.author.tag} earned ${earned} coins with !work`);


    await users.updateOne(
      { userId: userData.userId },
      {
        $inc: {
          coins: earned,
          lifetimeEarned: earned
        },
        $set: { lastWork: now }
      }
    );

    const embed = new EmbedBuilder()
      .setTitle('💼 Work Complete!')
      .setDescription(`You worked hard and earned **💵 ${earned} coins!**`)
      .setColor(0x00AE86);

    await message.reply({ embeds: [embed], components: [buttons] });
  } catch (err) {
      logError(message.client, `Error in !work command for ${message.author.tag}: ${err}`);
      await message.reply('❌ An error occurred while processing your work command.');
    }
  }
};
