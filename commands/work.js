export default {
  name: 'work',
  description: 'Earn coins by working (1-hour cooldown)',
  run: async ({ message, users, userData }) => {
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // 1 hour in ms

    if (userData.lastWork && now - userData.lastWork < cooldown) {
      const remaining = cooldown - (now - userData.lastWork);
      const minutes = Math.floor(remaining / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      return message.reply(`⏳ You need to wait ${minutes}m ${seconds}s before working again.`);
    }

    const earned = Math.floor(Math.random() * 100) + 50; // 50 to 149 coins

    await users.updateOne(
      { userId: userData.userId },
      {
        $inc: { coins: earned },
        $set: { lastWork: now }
      }
    );

    message.reply(`💼 You worked hard and earned 💵 ${earned} coins!`);
  }
};
