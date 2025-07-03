export default {
  name: 'clear',
  run: async ({ message, args }) => {
    // Check for 'Clear' role
    const role = message.guild.roles.cache.find(r => r.name === 'Clear');
    if (!role) return message.reply('❌ The `Clear` role does not exist.');
    if (!message.member.roles.cache.has(role.id)) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const sub = args[0]?.toLowerCase();

    if (sub === 'all') {
      // Try to delete in batches of 100 until nothing left
      let deletedCount = 0;

      while (true) {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        if (fetched.size === 0) break;

        await message.channel.bulkDelete(fetched, true);
        deletedCount += fetched.size;

        // Discord API: stop if oldest message is older than 14 days
        if (fetched.size < 100) break;
      }

      return message.channel.send(`✅ Cleared ~${deletedCount} messages.`)
        .then(msg => setTimeout(() => msg.delete(), 5000));
    }

    // Normal `!clear <number>`
    const amount = parseInt(sub);
    if (isNaN(amount) || amount < 2 || amount > 100) {
      return message.reply('Usage: `!clear <number>` (2–100) or `!clear all`');
    }

    await message.channel.bulkDelete(amount, true)
      .then(deleted => {
        message.channel.send(`✅ Cleared ${deleted.size} messages.`)
          .then(msg => setTimeout(() => msg.delete(), 5000));
      })
      .catch(err => {
        console.error(err);
        message.reply('❌ Failed. Make sure messages are not older than 14 days.');
      });
  },
};