export default {
  name: 'gift',
  description: 'Gift coins to another user\'s wallet',
  run: async ({ message, args, users, userData }) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply('Usage: `!gift @user <amount>`');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You can\'t gift coins to yourself.');
    }

    if (userData.coins < amount) {
      return message.reply('❌ You don\'t have enough coins in your wallet.');
    }

    // Fetch or create target user
    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) {
      targetData = {
        userId: target.id,
        coins: 0,
        bank: 0,
        lastDaily: 0,
        shieldUntil: 0,
        lastTax: 0,
        lifetimeEarned: 0,
        lifetimeGifted: 0
      };
      await users.insertOne(targetData);
    }

    // Update balances
    await users.updateOne(
      { userId: message.author.id },
      { $inc: { coins: -amount, lifetimeGifted: amount } }
    );

    await users.updateOne(
      { userId: target.id },
      { $inc: { coins: amount } }
    );

    message.reply(`🎁 You gifted **${amount} coins** to **${target.username}**!`);
  }
};
