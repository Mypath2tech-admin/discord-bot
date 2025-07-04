import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
export default {
  name: 'shield',
  run: async ({ message, userData }) => {
    const now = Date.now();
    const shieldActive = userData.shieldUntil && userData.shieldUntil > now;

    const formatTime = (ms) => {
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    };

    const status = shieldActive
      ? `🛡️ **Active** — ${formatTime(userData.shieldUntil - now)} left`
      : `❌ **No shield active.**`;

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Rob Protection Status')
      .setDescription(`Your shield status:\n\n${status}`)
      .setColor(shieldActive ? 0x00AE86 : 0xFF0000);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_shop')
        .setLabel('🛒 Open Shop')
        .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
