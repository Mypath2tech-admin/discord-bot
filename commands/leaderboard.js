export default {
  name: 'leaderboard',
  run: async ({ message, users }) => {
    const top = await users.find().sort({ coins: -1 }).limit(5).toArray();
    let reply = `🏆 **Top 5 Richest:**\n`;
    for (let i = 0; i < top.length; i++) {
      const name = (await message.guild.members.fetch(top[i].userId).catch(() => null))?.user.username || 'Unknown';
      reply += `${i + 1}. ${name} — 💰 ${top[i].coins} coins\n`;
    }
    message.reply(reply);
  }
};
