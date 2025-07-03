export default {
  name: 'daily',
  run: async ({ message, users, userData }) => {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - userData.lastDaily < cooldown) {
      const remaining = cooldown - (now - userData.lastDaily);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return message.reply(`⏳ You already claimed your daily! Try again in ${hours}h ${minutes}m.`);
    }

    const reward = Math.floor(Math.random() * 200) + 100;
    await users.updateOne({ userId: userData.userId }, { $inc: { coins: reward }, $set: { lastDaily: now } });

    message.reply(`✅ You claimed your daily and got 💰 ${reward} coins!`);
  }
};
