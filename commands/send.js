import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'send',
  run: async ({ message, args, users, userData }) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply('❌ Usage: `!send @user <amount>` (amount must be a positive number)');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You can’t send coins to yourself.');
    }

    if (target.bot) {
      return message.reply('🤖 You can’t send coins to a bot.');
    }

    if (!Number.isInteger(amount)) {
      return message.reply('❌ Please enter a whole number amount.');
    }

    if ((userData.coins || 0) < amount) {
      return message.reply('❌ You don’t have enough coins in your wallet.');
    }

    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) {
      targetData = {
        userId: target.id,
        coins: 0,
        bank: 0,
        lastDaily: 0
      };
      await users.insertOne(targetData);
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
