export default {
  name: 'balance',
  run: async ({ message, userData }) => {
    message.reply(`Wallet: 💰 ${userData.coins} coins.`);
  }
};
