import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'balance',
  run: async ({ message, userData }) => {
    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Balance`)
      .setDescription(`💰 **Wallet:** ${userData.coins} coins\n🏦 **Bank:** ${userData.bank} coins`)
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
  },
};
