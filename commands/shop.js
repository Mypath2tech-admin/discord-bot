import { getDb } from '../handlers/db.js'; // or however you get your DB

export default {
  name: 'shop',
  description: 'View all shop items',
  run: async ({ message }) => {
    const db = await getDb();
    const items = await db.collection('shopItems').find().toArray();

    if (items.length === 0) {
      return message.reply('🛒 The shop is empty!');
    }

    let shopList = '**🛍️ Shop Items:**\n';
    items.forEach(item => {
      shopList += `• **${item.name}** — ${item.price} coins\n${item.description}\n\n`;
    });

    message.reply(shopList);
  }
};
