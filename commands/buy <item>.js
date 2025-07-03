import { getDb } from '../handlers/db.js';

export default {
  name: 'buy',
  description: 'Buy an item from the shop',
  run: async ({ message, args, userData }) => {
    const db = await getDb();
    const itemName = args[0]?.toLowerCase();

    if (!itemName) return message.reply("Please specify an item to buy.");

    const item = await db.collection('shopItems').findOne({ name: { $regex: new RegExp(`^${itemName}$`, 'i') } });

    if (!item) return message.reply("Item not found.");

    if ((userData.coins || 0) < item.price) {
      return message.reply("You don't have enough coins.");
    }

    // Apply effects — example for shield
    if (item.name.toLowerCase() === 'shield') {
      const shieldDuration = item.durationHours * 60 * 60 * 1000;
      await db.collection('users').updateOne(
        { userId: message.author.id },
        {
          $inc: { coins: -item.price },
          $set: { shieldUntil: Date.now() + shieldDuration }
        }
      );
      return message.reply(`🛡️ Shield activated for ${item.durationHours} hour(s)!`);
    }

    // Fallback for generic item purchase
    await db.collection('users').updateOne(
      { userId: message.author.id },
      { $inc: { coins: -item.price } }
    );

    message.reply(`✅ You bought **${item.name}** for ${item.price} coins!`);
  }
};
