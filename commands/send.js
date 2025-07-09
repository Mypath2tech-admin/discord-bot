import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { logInfo, logWarn, logError } from "../utils/logger.js"; // Log: Import logger utils

export default {
  name: "send",
  run: async ({ message, args, users, userData }) => {
    try {
      // Log: Wrap logic in try/catch for error logging
      const target = message.mentions.users.first();
      const amount = parseInt(args[1]);

      if (!target || isNaN(amount) || amount <= 0) {
        logWarn(
          message.client,
          `User ${message.author.tag} used !send with invalid arguments.`
        );
        return message.reply(
          "❌ Usage: `!send @user <amount>` (amount must be a positive number)"
        );
      }

      if (target.id === message.author.id) {
        logWarn(
          message.client,
          `User ${message.author.tag} tried to send coins to themselves.`
        );
        return message.reply("❌ You can’t send coins to yourself.");
      }

      if (target.bot) {
        logWarn(
          message.client,
          `User ${message.author.tag} tried to send coins to a bot (${target.tag}).`
        );
        return message.reply("🤖 You can’t send coins to a bot.");
      }

      if (!Number.isInteger(amount)) {
        logWarn(
          message.client,
          `User ${message.author.tag} tried to send a non-integer amount (${amount}).`
        );
        return message.reply("❌ Please enter a whole number amount.");
      }

      if ((userData.coins || 0) < amount) {
        logWarn(
          message.client,
          `User ${message.author.tag} tried to send ${amount} coins but has insufficient funds.`
        );
        return message.reply("❌ You don’t have enough coins in your wallet.");
      }

      let targetData = await users.findOne({ userId: target.id });
      if (!targetData) {
        targetData = {
          userId: target.id,
          coins: 0,
          bank: 0,
          lastDaily: 0,
        };
        await users.insertOne(targetData);
      }

      await users.updateOne(
        { userId: userData.userId },
        { $inc: { coins: -amount } }
      );
      await users.updateOne({ userId: target.id }, { $inc: { coins: amount } });

      // Log: Successful coin transfer
      logInfo(
        message.client,
        `User ${message.author.tag} sent ${amount} coins to ${target.tag}.`
      );

      const embed = new EmbedBuilder()
        .setTitle("💸 Coins Sent!")
        .setDescription(
          `You sent **${amount} coins** to **${target.username}**.`
        )
        .setColor(0x00ae86);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("open_profile")
          .setLabel("👤 Profile")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("do_work")
          .setLabel("🛠️ Work")
          .setStyle(ButtonStyle.Secondary)
      );

      await message.reply({ embeds: [embed], components: [buttons] });
    } catch (err) {
      // Log: Error occurred in send command
      logError(
        message.client,
        `Error in !send command for ${message.author.tag}: ${err}`
      );
      await message.reply(
        "❌ An error occurred while processing your send command."
      );
    }
  },
};
