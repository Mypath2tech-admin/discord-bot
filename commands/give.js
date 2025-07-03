export default {
  name: 'give',
  description: 'Admin-only: Give coins to a user',
  run: async ({ message, args, users }) => {
    // ✅ Check for admin permission
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply('Usage: `!give @user <amount>`');
    }

    let targetData = await users.findOne({ userId: target.id });
    if (!targetData) {
      await users.insertOne({ userId: target.id, coins: 0, bank: 0, lastDaily: 0 });
    }

    await users.updateOne(
      { userId: target.id },
      { $inc: { coins: amount } }
    );

    return message.reply({
      embeds: [
        {
          title: '✅ Coins Granted',
          description: `Gave **💰 ${amount} coins** to **${target.username}**.`,
          color: 0x00AE86
        }
      ]
    });
  }
};
