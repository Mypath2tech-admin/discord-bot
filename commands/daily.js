import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'daily',
  run: async ({ message, users, userData }) => {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    const remaining = cooldown - (now - (userData.lastDaily || 0));
    const formatTime = (ms) => {
      const hours = Math.floor(ms / (60 * 60 * 1000));
      const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
      return `${hours}h ${minutes}m`;
    };

    if (remaining > 0) {
      const embed = new EmbedBuilder()
        .setTitle(`⏳ Daily Reward Cooldown`)
        .setDescription(`You already claimed your daily!\nTry again in **${formatTime(remaining)}**.`)
        .setColor(0xFF0000);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_profile')
          .setLabel('👤 Profile')
          .setStyle(ButtonStyle.Secondary)
      );

      return message.reply({ embeds: [embed], components: [buttons] });
    }

    const reward = Math.floor(Math.random() * 200) + 100;

    await users.updateOne(
      { userId: userData.userId },
      { $inc: { coins: reward }, $set: { lastDaily: now } }
    );

    const embed = new EmbedBuilder()
      .setTitle(`🎁 Daily Reward Claimed!`)
      .setDescription(`You got **💰 ${reward} coins!**`)
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
