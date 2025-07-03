import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'help',
  description: 'List all available commands and their descriptions',
  run: async ({ message }) => {
    const commands = [
      { name: 'balance', description: 'Check your wallet balance' },
      { name: 'bank', description: 'View wallet + bank & use banking buttons' },
      { name: 'daily', description: 'Claim your daily reward' },
      { name: 'deposit', description: 'Deposit coins into your bank' },
      { name: 'withdraw', description: 'Withdraw coins from your bank' },
      { name: 'work', description: 'Earn coins by working' },
      { name: 'rob', description: 'Attempt to rob another user' },
      { name: 'send', description: 'Send coins to another user' },
      { name: 'leaderboard', description: 'See the top richest users' },
      { name: 'shop', description: 'View available shop items' },
      { name: 'buy', description: 'Buy an item from the shop' },
      { name: 'profile', description: 'View your full profile and status' },
      { name: 'help', description: 'Show all bot commands' }
    ];

    const embed = new EmbedBuilder()
      .setTitle('🛠 MyPath2Tech Bot Commands')
      .setDescription(
        commands.map(cmd => `**!${cmd.name}** — ${cmd.description}`).join('\n')
      )
      .setColor(0x00AE86);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('open_shop')
        .setLabel('🛒 Shop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('open_leaderboard')
        .setLabel('🏆 Leaderboard')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [buttons] });
  },
};
