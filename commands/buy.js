import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'buy',
  description: 'Buy an item from the shop',
  run: async ({ message, args, users }) => {
    const itemName = args[0]?.toLowerCase();
    if (!itemName) return message.reply("❌ Please specify an item to buy.");

    const db = users.s.db;
    const shopItemsCollection = db.collection('shopItems');

    const item = await shopItemsCollection.findOne({
      name: { $regex: new RegExp(`^${itemName}$`, 'i') },
    });

    if (!item) return message.reply("❌ Item not found.");

    const userData = await users.findOne({ userId: message.author.id });

    if ((userData.coins || 0) < item.price) {
      return message.reply("❌ You don't have enough coins.");
    }

    // Handle shield logic
    if (item.name.toLowerCase() === 'shield') {
      const shieldDuration = item.durationHours * 60 * 60 * 1000;
      await users.updateOne(
        { userId: message.author.id },
        {
          $inc: { coins: -item.price },
          $set: { shieldUntil: Date.now() + shieldDuration },
        }
      );

      const embed = new EmbedBuilder()
        .setTitle(`✅ Purchase Successful`)
        .setDescription(`🛡️ Shield activated for **${item.durationHours} hour(s)**!`)
        .setColor(0x00AE86);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_shop')
          .setLabel('🛒 Open Shop')
          .setStyle(ButtonStyle.Primary)
      );

      return message.reply({ embeds: [embed], components: [buttons] });
    }

    // Generic item buy
    await users.updateOne(
      { userId: message.author.id },
      { $inc: { coins: -item.price } }
    );

    const embed = new EmbedBuilder()
      .setTitle(`✅ Purchase Successful`)
      .setDescription(`You bought **${item.name}** for **${item.price} coins**.`)
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_shop')
        .setLabel('🛒 Open Shop')
        .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
