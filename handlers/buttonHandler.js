export default async function ({ interaction, users }) {
  const userId = interaction.user.id;

  let userData = await users.findOne({ userId });
  if (!userData) {
    await users.insertOne({ userId, coins: 0, bank: 0, lastDaily: 0 });
    userData = { userId, coins: 0, bank: 0, lastDaily: 0 };
  }

  switch (interaction.customId) {
    // === BANK BUTTONS ===
    case 'deposit':
      if (userData.coins < 100) {
        return interaction.reply({ content: '❌ Not enough wallet funds.', ephemeral: true });
      }
      await users.updateOne({ userId }, { $inc: { coins: -100, bank: 100 } });
      return interaction.reply({ content: '✅ Deposited 💵 100 coins.', ephemeral: true });

    case 'withdraw':
      if (userData.bank < 100) {
        return interaction.reply({ content: '❌ Not enough bank funds.', ephemeral: true });
      }
      await users.updateOne({ userId }, { $inc: { coins: 100, bank: -100 } });
      return interaction.reply({ content: '✅ Withdrew 💸 100 coins.', ephemeral: true });

    case 'daily':
      {
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;
        if (now - (userData.lastDaily || 0) < cooldown) {
          return interaction.reply({ content: '⏳ You already claimed your daily.', ephemeral: true });
        }
        const reward = Math.floor(Math.random() * 200) + 100;
        await users.updateOne({ userId }, { $inc: { coins: reward }, $set: { lastDaily: now } });
        return interaction.reply({ content: `✅ Claimed 💰 ${reward} daily coins!`, ephemeral: true });
      }

    // === QUICK ACCESS SHORTCUTS ===
    case 'open_profile':
      return interaction.reply({ content: '👤 Type `!profile` to see your stats.', ephemeral: true });

    case 'do_work':
      return interaction.reply({ content: '🛠️ Type `!work` to earn coins.', ephemeral: true });

    case 'open_shop':
      return interaction.reply({ content: '🛒 Type `!shop` to open the shop.', ephemeral: true });

    case 'open_leaderboard':
      return interaction.reply({ content: '🏆 Type `!leaderboard` to see the top players.', ephemeral: true });

    default:
      return interaction.reply({ content: '❌ Unknown button.', ephemeral: true });
  }
}
