export default {
  name: 'balance',
  run: async ({ message, userData }) => {
    message.reply(`Wallet: 💰 ${userData.coins} coins.`);
    console.log(`${message.author.username}'s wallet: ${userData.coins}`);
    node index.js
  }
};
