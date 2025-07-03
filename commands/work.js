export default {
  name: 'work',
  run: async ({ message, users, userData }) => {
    const earned = Math.floor(Math.random() * 100) + 50;
    await users.updateOne({ userId: userData.userId }, { $inc: { coins: earned } });
    message.reply(`💼 You worked and earned 💵 ${earned} coins!`);
  }
};
