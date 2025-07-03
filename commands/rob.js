export default {
  name: 'rob',
  run: async ({ message, args, users, userData }) => {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: !rob @user');
    if (target.id === message.author.id) return message.reply('Can\'t rob yourself.');

    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) return message.reply('Target doesn\'t exist.');

    const victimWallet = targetData.coins;
    if (victimWallet < 50) return message.reply('They don\'t have enough to rob.');

    const success = Math.random() < 0.5;
    if (success) {
      const stolen = Math.floor(Math.random() * (victimWallet * 0.3)) + 10;
      await users.updateOne({ userId: userData.userId }, { $inc: { coins: stolen } });
      await users.updateOne({ userId: target.id }, { $inc: { coins: -stolen } });
      message.reply(`Robbery success! Stole 💰 ${stolen} coins from ${target.username}.`);
    } else {
      const fine = 50;
      await users.updateOne({ userId: userData.userId }, { $inc: { coins: -fine } });
      message.reply(`Rob failed! Caught & fined 💸 ${fine} coins.`);
    }
  }
};
