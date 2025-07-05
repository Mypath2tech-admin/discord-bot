import { getDb } from '../handlers/db.js';

export default {
  name: 'removeitem',
  description: 'Remove an item from the shop (admin only)',
  run: async ({ message, args }) => {
    // Optional: Only allow server owner or devs
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You don’t have permission to use this command.');
    }

    const itemName = args.join(' ');
    if (!itemName) return message.reply('Usage: `!removeitem <item name>`');

    const db = await getDb();
    const result = await db.collection('shopItems').deleteOne({ name: { $regex: new RegExp(`^${itemName}$`, 'i') } });

    if (result.deletedCount === 0) {
      return message.reply('❌ No item found with that name.');
    }

    message.reply(`🗑️ Item **${itemName}** removed from the shop.`);
  }
};
