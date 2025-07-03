import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'shop',
  description: 'View all shop items',
  run: async ({ message, users }) => {
    const db = users.s.db; // same DB from your users collection
    const items = await db.collection('shopItems').find().toArray();

    if (items.length === 0) {
      return message.reply('🛒 The shop is empty!');
    }

    const embed = new EmbedBuilder()
      .setTitle('🛍️ Shop Items')
      .setDescription(
        items.map(item => 
          `**${item.name}** — ${item.price} coins\n${item.description || ''}`
        ).join('\n\n')
      )
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
