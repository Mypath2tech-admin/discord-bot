export default {
  name: 'profile',
  description: 'View your wallet, bank, cooldowns, and shield status',
  run: async ({ message, userData }) => {
    const now = Date.now();

    const lastDaily = userData.lastDaily
      ? new Date(userData.lastDaily).toLocaleString()
      : 'Never';
    const lastWork = userData.lastWork
      ? new Date(userData.lastWork).toLocaleString()
      : 'Never';

    const shieldStatus =
      userData.shieldUntil && userData.shieldUntil > now
        ? `🛡️ Active until ${new Date(userData.shieldUntil).toLocaleString()}`
        : '❌ Not active';

    message.reply(
      `👤 **${message.author.username}'s Profile**\n` +
      `💰 Wallet: ${userData.coins || 0}\n` +
      `🏦 Bank: ${userData.bank || 0}\n` +
      `📆 Last Daily: ${lastDaily}\n` +
      `💼 Last Work: ${lastWork}\n` +
      `${shieldStatus}`
    );
  }
};
