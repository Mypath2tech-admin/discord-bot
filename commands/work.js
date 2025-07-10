import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';
import { getConfig } from '../utils/config.js';
import { checkAchievements } from '../utils/economy.js';
import { trackUserActivity, validateTransaction } from '../utils/security.js';

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
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('show_logs')
        .setLabel('📜 Log')
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
    const minAmount = getConfig('economy.workMinAmount') || 50;
    const maxAmount = getConfig('economy.workMaxAmount') || 200;
    const earned = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    
    // Validate transaction
    const validation = validateTransaction(userData.userId, 'earn', earned, userData);
    if (!validation.valid) {
      logWarn(message.client, `Work transaction validation failed for ${message.author.tag}: ${validation.errors.join(', ')}`);
      return message.reply('❌ Transaction failed validation. Please try again later.');
    }

    // Track activity for security
    trackUserActivity(userData.userId, 'work_earn', earned);
    
    logInfo(message.client, `User ${message.author.tag} earned ${earned} coins with !work`, {
      userId: userData.userId,
      earned: earned,
      action: 'work_completed'
    });

    // Update user data and increment work count
    await users.updateOne(
      { userId: userData.userId },
      {
        $inc: {
          coins: earned,
          lifetimeEarned: earned,
          workCount: 1  // Track for achievements
        },
        $set: { lastWork: now }
      }
    );

    // Check for achievements
    const newUserData = { ...userData, coins: userData.coins + earned, workCount: (userData.workCount || 0) + 1 };
    const achievements = await checkAchievements(users, userData.userId, newUserData, message.client);

    let achievementText = '';
    if (achievements.length > 0) {
      achievementText = `\n\n🏆 **Achievements Unlocked:**\n${achievements.map(a => `• ${a.name} (+${a.reward} coins)`).join('\n')}`;
    }

    const embed = new EmbedBuilder()
      .setTitle('💼 Work Complete!')
      .setDescription(`You worked hard and earned **💵 ${earned} coins!**` + achievementText)
      .setColor(0x00AE86);

    await message.reply({ embeds: [embed], components: [buttons] });
  } catch (err) {
      logError(message.client, `Error in !work command for ${message.author.tag}: ${err}`);
      await message.reply('❌ An error occurred while processing your work command.');
    }
  }
};
