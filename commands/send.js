export default {
  name: 'send',
  run: async ({ message, args, users, userData }) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply('Usage: !send @user <amount>');
    }
    if (target.id === message.author.id) return message.reply('Can\'t send to yourself.');
    if (userData.coins < amount) return message.reply('Not enough coins.');

    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) {
      await users.insertOne({ userId: target.id, coins: 0, bank: 0, lastDaily: 0 });
    }

    await users.updateOne({ userId: userData.userId }, { $inc: { coins: -amount } });
    await users.updateOne({ userId: target.id }, { $inc: { coins: amount } });
    message.reply(`Sent 💸 ${amount} coins to ${target.username}.`);
  }
};
