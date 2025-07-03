export default {
  name: 'createroles',
  description: 'Admin: Create all required roles if missing',
  run: async ({ message }) => {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You do not have permission.');
    }

    const roleNames = [
      'Active',
      'Super Active',
      'Knowledgeable',
      'Blue',
      'Red',
      'Green',
      'Yellow',
      'Black'
    ];

    for (const name of roleNames) {
      let role = message.guild.roles.cache.find(r => r.name === name);
      if (!role) {
        await message.guild.roles.create({
          name,
          reason: 'Auto-created by bot',
        });
      }
    }

    message.reply('✅ All roles checked & created if missing.');
  }
};
