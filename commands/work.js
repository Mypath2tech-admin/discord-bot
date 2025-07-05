import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'work',
  description: 'Earn coins by working (1-hour cooldown)',
  run: async ({ message, users, userData }) => {
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // 1 hour

    const remaining = cooldown - (now - (userData.lastWork || 0));
    const formatTime = (ms) => {
      const m = Math.floor(ms / (60 * 1000));
      const s = Math.floor((ms % (60 * 1000)) / 1000);
      return `${m}m ${s}s`;
    };

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('daily')
        .setLabel('🎁 Daily')
        .setStyle(ButtonStyle.Secondary)
    );

    if (remaining > 0) {
      const embed = new EmbedBuilder()
        .setTitle('⏳ Work Cooldown')
        .setDescription(`You need to wait **${formatTime(remaining)}** before working again.`)
        .setColor(0xFF0000);

      return message.reply({ embeds: [embed], components: [buttons] });
    }

    const earned = Math.floor(Math.random() * 100) + 50;

    await users.updateOne(
      { userId: userData.userId },
      {
        $inc: {
          coins: earned,
          lifetimeEarned: earned
        },
        $set: { lastWork: now }
      }
    );

    const embed = new EmbedBuilder()
      .setTitle('💼 Work Complete!')
      .setDescription(`You worked hard and earned **💵 ${earned} coins!**`)
      .setColor(0x00AE86);

    await message.reply({ embeds: [embed], components: [buttons] });
  }
};
