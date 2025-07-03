import { getDb } from '../handlers/db.js';

export default {
  name: 'shield',
  description: 'Buy rob protection for a few hours',
  run: async ({ message, userData }) => {
    const db = await getDb();
    const item = await db.collection('shopItems').findOne({ name: 'Shield' });

    if (!item) return message.reply("Shield item not found in shop.");
    if ((userData.coins || 0) < item.price) {
      return message.reply("Not enough coins.");
    }

    const duration = item.durationHours * 60 * 60 * 1000;

    await db.collection('users').updateOne(
      { userId: message.author.id },
      {
        $inc: { coins: -item.price },
        $set: { shieldUntil: Date.now() + duration }
      }
    );

    message.reply(`🛡️ Shield purchased! Active for ${item.durationHours} hour(s).`);
  }
};
