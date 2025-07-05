import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDb } from '../handlers/db.js';

export default {
  name: 'balance',
  run: async ({ message, userData }) => {
    const db = await getDb();
    const users = db.collection('users');

    // Auto-create user if not found
    if (!userData) {
      userData = {
        userId: message.author.id,
        coins: 0,
        bank: 0,
        lastDaily: 0,
        shieldUntil: 0,
        lastTax: 0
      };
      await users.insertOne(userData);
    }

    const now = Date.now();
    const taxCooldown = 24 * 60 * 60 * 1000;
    const taxRate = 0.05; // 5%
    let taxNotice = '';

    if (!userData.lastTax || now - userData.lastTax >= taxCooldown) {
      const taxedAmount = Math.floor((userData.coins || 0) * taxRate);

      if (taxedAmount > 0) {
        userData.coins -= taxedAmount;
        userData.lastTax = now;

        await users.updateOne(
          { userId: message.author.id },
          {
            $inc: { coins: -taxedAmount },
            $set: { lastTax: now }
          }
        );

        taxNotice = `💸 **${taxedAmount} coins** were taxed from your wallet (5% daily tax).`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Balance`)
      .setDescription(
        `💰 **Wallet:** ${userData.coins} coins\n🏦 **Bank:** ${userData.bank} coins` +
        (taxNotice ? `\n\n${taxNotice}` : '')
      )
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_bank')
        .setLabel('🏦 Open Bank')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  }
};
