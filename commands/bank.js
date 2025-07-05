import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDb } from '../handlers/db.js';

export default {
  name: 'bank',
  run: async ({ message, userData }) => {
    const db = await getDb();
    const users = db.collection('users');

    const now = Date.now();
    const interestCooldown = 24 * 60 * 60 * 1000; // 24 hours
    const interestRate = 0.02; // 2%

    if (!userData.lastInterest || now - userData.lastInterest >= interestCooldown) {
      const earnedInterest = Math.floor((userData.bank || 0) * interestRate);

      if (earnedInterest > 0) {
        userData.bank += earnedInterest;
        userData.lastInterest = now;

        await users.updateOne(
          { userId: userData.userId },
          {
            $inc: { bank: earnedInterest },
            $set: { lastInterest: now }
          }
        );
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏦 ${message.author.username}'s Bank`)
      .setDescription(
        `💰 **Wallet:** ${userData.coins} coins\n` +
        `🏦 **Bank:** ${userData.bank} coins`
      )
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('deposit')
        .setLabel('💵 Deposit 100')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('withdraw')
        .setLabel('💸 Withdraw 100')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('daily')
        .setLabel('🎁 Daily Reward')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
