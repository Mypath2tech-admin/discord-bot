import { getDb } from '../handlers/db.js';

export default {
  name: 'edititem',
  description: 'Edit a shop item (admin only)',
  run: async ({ message, args }) => {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You don’t have permission to use this command.');
    }

    const [itemName, field, ...rest] = args;
    const newValue = rest.join(' ');
    if (!itemName || !field || !newValue) {
      return message.reply('Usage: `!edititem <item name> <field> <new value>`');
    }

    const db = await getDb();
    const item = await db.collection('shopItems').findOne({ name: { $regex: new RegExp(`^${itemName}$`, 'i') } });

    if (!item) return message.reply('❌ No item found with that name.');

    // Parse value type
    let value;
    if (!isNaN(newValue)) {
      value = Number(newValue); // auto convert numbers
    } else {
      value = newValue;
    }

    const update = { $set: { [field]: value } };
    await db.collection('shopItems').updateOne({ _id: item._id }, update);

    message.reply(`✅ Updated **${field}** of **${item.name}** to **${value}**.`);
  }
};
