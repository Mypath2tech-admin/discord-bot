export default {
  name: 'adddefaultitems',
  description: 'Admin: Add default shop items',
  run: async ({ message, users }) => {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You do not have permission.');
    }

    const db = users.s.db; // same connection

    const items = [
      { name: 'Blue', price: 500, description: 'Grants the Blue role.' },
      { name: 'Red', price: 500, description: 'Grants the Red role.' },
      { name: 'Green', price: 500, description: 'Grants the Green role.' },
      { name: 'Yellow', price: 500, description: 'Grants the Yellow role.' },
      { name: 'Black', price: 500, description: 'Grants the Black role.' },
      { name: 'Shield', price: 1000, description: 'Protects you from robbery for a few hours.', durationHours: 6 }
    ];

    await db.collection('shopItems').insertMany(items);

    message.reply('✅ Default shop items added!');
  }
};
