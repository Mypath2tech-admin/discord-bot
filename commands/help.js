export default {
  name: 'help',
  description: 'List all available commands and their descriptions',
  run: async ({ message, client }) => {
    // If you have a dynamic way of loading commands, this may not be needed
    const commands = [
      { name: 'balance', description: 'Check your wallet balance' },
      { name: 'bank', description: 'View total coins (wallet + bank)' },
      { name: 'daily', description: 'Claim your daily reward' },
      { name: 'deposit', description: 'Deposit coins into your bank' },
      { name: 'withdraw', description: 'Withdraw coins from your bank' },
      { name: 'work', description: 'Earn coins by working' },
      { name: 'rob', description: 'Attempt to rob another user' },
      { name: 'send', description: 'Send coins to another user' },
      { name: 'leaderboard', description: 'See the top richest users' },
      { name: 'help', description: 'Show all bot commands' }
    ];

    let helpMessage = '**🛠 MyPath2Tech Bot Commands:**\n';
    for (const cmd of commands) {
      helpMessage += `\n• **!${cmd.name}** — ${cmd.description}`;
    }

    message.reply(helpMessage);
  }
};

