import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logInfo, logWarn, logError } from '../utils/logger.js'; // Log: Import logger utils

export default {
  name: 'rob',
  run: async ({ message, args, users, userData }) => {
    try { // Log: Wrap logic in try/catch for error logging
      const target = message.mentions.users.first();
      if (!target) {
        logWarn(message.client, `User ${message.author.tag} tried !rob without mentioning a user.`);
        return message.reply('Usage: !rob @user');
      }
      if (target.id === message.author.id) {
        logWarn(message.client, `User ${message.author.tag} tried to rob themselves.`);
        return message.reply('❌ You can\'t rob yourself.');
      }
      if (target.bot) {
        logWarn(message.client, `User ${message.author.tag} tried to rob a bot (${target.tag}).`);
        return message.reply('❌ You can\'t rob a bot.');
      }

      const now = Date.now();
      const targetData = await users.findOne({ userId: target.id });
      if (!targetData) {
        logWarn(message.client, `User ${message.author.tag} tried to rob ${target.tag} who has no coins.`);
        return message.reply('❌ That user has no coins.');
      }

      const victimWallet = targetData.coins || 0;
      const robberWallet = userData.coins || 0;
      const shieldActive = targetData.shieldUntil && targetData.shieldUntil > now;

      if (shieldActive) {
        logWarn(message.client, `User ${message.author.tag} tried to rob ${target.tag} but they have an active shield.`);
        return message.reply(`🛡️ You can't rob ${target.username} — they have an active shield!`);
      }

      if (victimWallet < 50) {
        logWarn(message.client, `User ${message.author.tag} tried to rob ${target.tag} but victim has less than 50 coins.`);
        return message.reply('❌ They don\'t have enough coins to rob (min 50 required).');
      }

      const success = Math.random() < 0.5;

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('do_work')
          .setLabel('🛠️ Work')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('open_profile')
          .setLabel('👤 Profile')
          .setStyle(ButtonStyle.Secondary)
      );

      if (success) {
        const maxSteal = Math.min(Math.floor(victimWallet * 0.3), victimWallet);
        const stolen = Math.floor(Math.random() * maxSteal) + 10;
        const finalAmount = Math.min(stolen, victimWallet);

        await users.updateOne({ userId: userData.userId }, { $inc: { coins: finalAmount } });
        await users.updateOne({ userId: target.id }, { $inc: { coins: -finalAmount } });

        // Log: Successful robbery
        logInfo(
          message.client,
          `User ${message.author.tag} successfully robbed ${finalAmount} coins from ${target.tag} (victim had ${victimWallet} coins).`
        );

        const embed = new EmbedBuilder()
          .setTitle('🔪 Robbery Success!')
          .setDescription(`You stole **💰 ${finalAmount} coins** from ${target.username}.`)
          .setColor(0x00AE86);

        return message.reply({ embeds: [embed], components: [buttons] });
      } else {
        const fine = 50;
        const finePaid = Math.min(robberWallet, fine);

        await users.updateOne({ userId: userData.userId }, { $inc: { coins: -finePaid } });

        // Log: Failed robbery
        logInfo(
          message.client,
          `User ${message.author.tag} failed to rob ${target.tag} and paid a fine of ${finePaid} coins.`
        );

        const embed = new EmbedBuilder()
          .setTitle('🚨 Robbery Failed!')
          .setDescription(`You got caught and paid a **💸 ${finePaid} coin fine**.`)
          .setColor(0xFF0000);

        return message.reply({ embeds: [embed], components: [buttons] });
      }
    } catch (err) {
      // Log: Error occurred in rob command
      logError(message.client, `Error in !rob command for ${message.author.tag}: ${err}`);
      await message.reply('❌ An error occurred while processing your rob command.');
    }
  },
};