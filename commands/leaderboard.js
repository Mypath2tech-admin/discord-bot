import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'leaderboard',
  run: async ({ message, users }) => {
    const top = await users.find().sort({ coins: -1 }).limit(5).toArray();

    let description = '';
    for (let i = 0; i < top.length; i++) {
      const member = await message.guild.members.fetch(top[i].userId).catch(() => null);
      const name = member?.user.username || 'Unknown';
      description += `**${i + 1}. ${name}** — 💰 ${top[i].coins} coins\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Top 5 Richest Users')
      .setDescription(description)
      .setColor(0xFFD700);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('do_work')
        .setLabel('🛠️ Work')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('claim_daily')
        .setLabel('🎁 Daily')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
