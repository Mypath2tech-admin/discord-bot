import { EmbedBuilder } from 'discord.js';

export default {
  name: 'ready',
  description: 'Let the bot know you’re ready to be upgraded',
  run: async ({ message, users }) => {
    // simply reply with the required message
    await message.reply('im ready to be upgraded 💪 @DEV');
  },
};
