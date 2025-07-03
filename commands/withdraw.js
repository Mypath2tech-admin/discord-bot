export default {
  name: 'withdraw',
  run: async ({ message, users, userData, args }) => {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('Usage: `!withdraw <amount>`');
    }
    if (userData.bank < amount) {
      return message.reply('❌ Not enough in your bank.');
    }

    await users.updateOne({ userId: userData.userId }, { $inc: { coins: amount, bank: -amount } });
    message.reply(`✅ Withdrew 💸 ${amount} coins to your wallet.`);
  }
};
