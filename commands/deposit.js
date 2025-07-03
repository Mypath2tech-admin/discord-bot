export default {
  name: 'deposit',
  run: async ({ message, users, userData, args }) => {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('Usage: `!deposit <amount>`');
    }
    if (userData.coins < amount) {
      return message.reply('❌ Not enough in your wallet.');
    }

    await users.updateOne({ userId: userData.userId }, { $inc: { coins: -amount, bank: amount } });
    message.reply(`✅ Deposited 💵 ${amount} coins to your bank.`);
  }
};
