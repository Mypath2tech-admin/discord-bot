import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'withdraw',
  run: async ({ message, users, userData, args }) => {
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) {
      return message.reply('Usage: `!withdraw <amount>`');
    }

    if (userData.bank < amount) {
      return message.reply('❌ You don\'t have enough in your bank.');
    }

    await users.updateOne(
      { userId: userData.userId },
      { $inc: { coins: amount, bank: -amount } }
    );

    const embed = new EmbedBuilder()
      .setTitle('🏦 Withdrawal Successful')
      .setDescription(`You withdrew **💸 ${amount} coins** to your wallet.`)
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('deposit')
        .setLabel('💵 Deposit')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
