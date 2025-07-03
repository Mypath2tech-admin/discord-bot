import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'send',
  run: async ({ message, args, users, userData }) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply('Usage: `!send @user <amount>`');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You can\'t send coins to yourself.');
    }

    if (userData.coins < amount) {
      return message.reply('❌ You don\'t have enough coins.');
    }

    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) {
      await users.insertOne({ userId: target.id, coins: 0, bank: 0, lastDaily: 0 });
    }

    await users.updateOne({ userId: userData.userId }, { $inc: { coins: -amount } });
    await users.updateOne({ userId: target.id }, { $inc: { coins: amount } });

    const embed = new EmbedBuilder()
      .setTitle('💸 Coins Sent!')
      .setDescription(`You sent **${amount} coins** to **${target.username}**.`)
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('do_work')
        .setLabel('🛠️ Work')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
