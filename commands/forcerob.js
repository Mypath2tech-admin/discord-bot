export default {
  name: 'forcerob',
  description: 'Admin-only: Force rob a user (simulate a bot rob)',
  run: async ({ message, args, users }) => {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You do not have permission.');
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `!forcerob @user`');

    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) return message.reply('Target not found.');

    const shieldActive = targetData.shieldUntil && targetData.shieldUntil > Date.now();
    if (shieldActive) {
      return message.reply(`🛡️ ${target.username} is protected by a shield.`);
    }

    const victimWallet = targetData.coins;
    if (victimWallet < 50) return message.reply('Target too broke to rob.');

    const stolen = Math.floor(Math.random() * (victimWallet * 0.3)) + 10;
    await users.updateOne({ userId: target.id }, { $inc: { coins: -stolen } });

    return message.reply({
      embeds: [
        {
          title: '🤖 Bot Robbery!',
          description: `The bot robbed **${stolen} coins** from ${target.username}.`,
          color: 0xFF0000
        }
      ]
    });
  }
};
