export default async function ({ interaction, users }) {
  const userId = interaction.user.id;

  let userData = await users.findOne({ userId });
  if (!userData) {
    await users.insertOne({ userId, coins: 0, bank: 0, lastDaily: 0 });
    userData = { userId, coins: 0, bank: 0, lastDaily: 0 };
  }

  switch (interaction.customId) {
    case 'deposit':
      if (userData.coins < 100) return interaction.reply({ content: 'Not enough wallet funds.', ephemeral: true });
      await users.updateOne({ userId }, { $inc: { coins: -100, bank: 100 } });
      return interaction.reply({ content: 'Deposited 💵 100 coins.', ephemeral: true });

    case 'withdraw':
      if (userData.bank < 100) return interaction.reply({ content: 'Not enough bank funds.', ephemeral: true });
      await users.updateOne({ userId }, { $inc: { coins: 100, bank: -100 } });
      return interaction.reply({ content: 'Withdrew 💸 100 coins.', ephemeral: true });

    case 'daily':
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;
      if (now - userData.lastDaily < cooldown) {
        return interaction.reply({ content: `Already claimed daily.`, ephemeral: true });
      }
      const reward = Math.floor(Math.random() * 200) + 100;
      await users.updateOne({ userId }, { $inc: { coins: reward }, $set: { lastDaily: now } });
      return interaction.reply({ content: `Claimed 💰 ${reward} daily coins!`, ephemeral: true });

    default:
      return interaction.reply({ content: `Unknown button.`, ephemeral: true });
  }
}
