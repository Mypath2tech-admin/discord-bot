import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'bank',
  run: async ({ message, userData }) => {
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
