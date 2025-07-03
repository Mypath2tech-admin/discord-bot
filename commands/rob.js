import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'rob',
  run: async ({ message, args, users, userData }) => {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: !rob @user');
    if (target.id === message.author.id) return message.reply('❌ You can\'t rob yourself.');

    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) return message.reply('❌ That user has no coins.');

    const victimWallet = targetData.coins;
    const shieldActive = targetData.shieldUntil && targetData.shieldUntil > Date.now();

    if (shieldActive) {
      return message.reply(`🛡️ You can't rob ${target.username} — they have an active shield!`);
    }

    if (victimWallet < 50) return message.reply('❌ They don\'t have enough coins to rob.');

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
      const stolen = Math.floor(Math.random() * (victimWallet * 0.3)) + 10;

      await users.updateOne({ userId: userData.userId }, { $inc: { coins: stolen } });
      await users.updateOne({ userId: target.id }, { $inc: { coins: -stolen } });

      const embed = new EmbedBuilder()
        .setTitle('🔪 Robbery Success!')
        .setDescription(`You stole **💰 ${stolen} coins** from ${target.username}.`)
        .setColor(0x00AE86);

      return message.reply({ embeds: [embed], components: [buttons] });
    } else {
      const fine = 50;

      await users.updateOne({ userId: userData.userId }, { $inc: { coins: -fine } });

      const embed = new EmbedBuilder()
        .setTitle('🚨 Robbery Failed!')
        .setDescription(`You got caught and paid a **💸 ${fine} coin fine**.`)
        .setColor(0xFF0000);

      return message.reply({ embeds: [embed], components: [buttons] });
    }
  }
};
