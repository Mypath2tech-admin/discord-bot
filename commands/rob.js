import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'rob',
  run: async ({ message, args, users, userData }) => {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: !rob @user');
    if (target.id === message.author.id) return message.reply('❌ You can\'t rob yourself.');
    if (target.bot) return message.reply('❌ You can\'t rob a bot.');

    const now = Date.now();
    const targetData = await users.findOne({ userId: target.id });
    if (!targetData) return message.reply('❌ That user has no coins.');

    const victimWallet = targetData.coins || 0;
    const robberWallet = userData.coins || 0;
    const shieldActive = targetData.shieldUntil && targetData.shieldUntil > now;

    if (shieldActive) {
      return message.reply(`🛡️ You can't rob ${target.username} — they have an active shield!`);
    }

    if (victimWallet < 50) {
      return message.reply('❌ They don\'t have enough coins to rob (min 50 required).');
    }

    const success = Math.random() < 0.5;

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('do_work')
        .setLabel('🛠️ Work')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Secondary)
    );

    if (success) {
      const maxSteal = Math.min(Math.floor(victimWallet * 0.3), victimWallet);
      const stolen = Math.floor(Math.random() * maxSteal) + 10;
      const finalAmount = Math.min(stolen, victimWallet);

      await users.updateOne({ userId: userData.userId }, { $inc: { coins: finalAmount } });
      await users.updateOne({ userId: target.id }, { $inc: { coins: -finalAmount } });

      const embed = new EmbedBuilder()
        .setTitle('🔪 Robbery Success!')
        .setDescription(`You stole **💰 ${finalAmount} coins** from ${target.username}.`)
        .setColor(0x00AE86);

      return message.reply({ embeds: [embed], components: [buttons] });
    } else {
      const fine = 50;
      const finePaid = Math.min(robberWallet, fine);

      await users.updateOne({ userId: userData.userId }, { $inc: { coins: -finePaid } });

      const embed = new EmbedBuilder()
        .setTitle('🚨 Robbery Failed!')
        .setDescription(`You got caught and paid a **💸 ${finePaid} coin fine**.`)
        .setColor(0xFF0000);

      return message.reply({ embeds: [embed], components: [buttons] });
    }
  }
};
