import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'profile',
  run: async ({ message, userData }) => {
    const now = Date.now();

    // Cooldowns
    const dailyCooldown = 24 * 60 * 60 * 1000;
    const workCooldown = 30 * 60 * 1000;
    const robCooldown = 6 * 60 * 60 * 1000;

    const dailyLeft = Math.max(0, dailyCooldown - (now - (userData.lastDaily || 0)));
    const workLeft = Math.max(0, workCooldown - (now - (userData.lastWork || 0)));
    const robLeft = Math.max(0, robCooldown - (now - (userData.lastRob || 0)));

    const formatTime = (ms) => {
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    };

    const shieldActive = userData.shieldUntil && userData.shieldUntil > now;
    const shieldLeft = shieldActive ? formatTime(userData.shieldUntil - now) : 'None';

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${message.author.username}'s Profile`)
      .setDescription(
        `💰 **Wallet:** ${userData.coins}\n` +
        `🏦 **Bank:** ${userData.bank}\n\n` +
        `🎁 **Next Daily:** ${dailyLeft > 0 ? formatTime(dailyLeft) : 'Ready!'}\n` +
        `🛠️ **Next Work:** ${workLeft > 0 ? formatTime(workLeft) : 'Ready!'}\n` +
        `🔪 **Next Rob:** ${robLeft > 0 ? formatTime(robLeft) : 'Ready!'}\n\n` +
        `🛡️ **Shield:** ${shieldActive ? `Active (${shieldLeft})` : 'None'}`
      )
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('daily')
        .setLabel('🎁 Claim Daily')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('do_work')
        .setLabel('🛠️ Work')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('open_shop')
        .setLabel('🛒 Open Shop')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
