import { EmbedBuilder } from 'discord.js';

export default {
  name: 'stats',
  description: 'View your lifetime stats',
  run: async ({ message, userData }) => {
    const coins = userData.coins || 0;
    const bank = userData.bank || 0;
    const total = coins + bank;
    const earned = userData.lifetimeEarned || 0;
    const spent = userData.lifetimeSpent || 0;

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${message.author.username}'s Stats`)
      .setColor(0x00AE86)
      .setDescription(
        `**💰 Wallet:** ${coins} coins\n` +
        `**🏦 Bank:** ${bank} coins\n` +
        `**💵 Total:** ${total} coins\n\n` +
        `**📈 Lifetime Earned:** ${earned} coins\n` +
        `**📉 Lifetime Spent:** ${spent} coins`
      );

    await message.reply({ embeds: [embed] });
  }
};
