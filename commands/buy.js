import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { logInfo, logWarn, logError } from "../utils/logger.js"; // Log: Import logger utils

export default {
  name: "buy",
  description: "Buy an item from the shop with GUI and role support",
  run: async ({ message, args, users }) => {
    try {
      // Log: Wrap logic in try/catch for error logging
      const itemName = args[0]?.toLowerCase();
      if (!itemName) {
        logWarn(
          message.client,
          `User ${message.author.tag} used !buy without specifying an item.`
        );
        return message.reply("❌ Please specify an item to buy.");
      }

      const db = users.s.db;
      const shopItemsCollection = db.collection("shopItems");

      const item = await shopItemsCollection.findOne({
        name: { $regex: new RegExp(`^${itemName}$`, "i") },
      });

      if (!item) {
        logWarn(
          message.client,
          `User ${message.author.tag} tried to buy a non-existent item: ${itemName}`
        );
        return message.reply("❌ Item not found.");
      }

      const userData = await users.findOne({ userId: message.author.id });

      if ((userData.coins || 0) < item.price) {
        logWarn(
          message.client,
          `User ${message.author.tag} tried to buy ${item.name} but has insufficient funds.`
        );
        return message.reply("❌ You don't have enough coins.");
      }

      // Handle shield logic
      if (item.name.toLowerCase() === "shield") {
        if (userData.shieldUntil && userData.shieldUntil > Date.now()) {
          logWarn(
            message.client,
            `User ${message.author.tag} tried to buy a shield but already has one active.`
          );
          return message.reply("🛡️ You already have an active shield.");
        }

        const shieldDuration = item.durationHours * 60 * 60 * 1000;
        await users.updateOne(
          { userId: message.author.id },
          {
            $inc: { coins: -item.price },
            $set: { shieldUntil: Date.now() + shieldDuration },
          }
        );

        // Log: Successful shield purchase
        logInfo(
          message.client,
          `User ${message.author.tag} bought a shield for ${item.price} coins.`
        );

        const embed = new EmbedBuilder()
          .setTitle(`✅ Purchase Successful`)
          .setDescription(
            `🛡️ Shield activated for **${item.durationHours} hour(s)**!`
          )
          .setColor(0x00ae86);

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open_shop")
            .setLabel("🛒 Open Shop")
            .setStyle(ButtonStyle.Primary)
        );

        return message.reply({ embeds: [embed], components: [buttons] });
      }

      // Check if the item name matches a server role
      const role = message.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === item.name.toLowerCase()
      );
      if (role) {
        await users.updateOne(
          { userId: message.author.id },
          { $inc: { coins: -item.price } }
        );
        await message.member.roles.add(role);

        // Log: Successful role purchase
        logInfo(
          message.client,
          `User ${message.author.tag} bought the role "${item.name}" for ${item.price} coins.`
        );

        const embed = new EmbedBuilder()
          .setTitle(`✅ Purchase Successful`)
          .setDescription(
            `You bought the **${item.name}** role for **${item.price} coins**.`
          )
          .setColor(0x00ae86);

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open_shop")
            .setLabel("🛒 Open Shop")
            .setStyle(ButtonStyle.Primary)
        );

        return message.reply({ embeds: [embed], components: [buttons] });
      }

      // Generic item buy fallback
      await users.updateOne(
        { userId: message.author.id },
        { $inc: { coins: -item.price } }
      );

      // Log: Successful generic item purchase
      logInfo(
        message.client,
        `User ${message.author.tag} bought ${item.name} for ${item.price} coins.`
      );

      const embed = new EmbedBuilder()
        .setTitle(`✅ Purchase Successful`)
        .setDescription(
          `You bought **${item.name}** for **${item.price} coins**.`
        )
        .setColor(0x00ae86);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("open_shop")
          .setLabel("🛒 Open Shop")
          .setStyle(ButtonStyle.Primary)
      );

      await message.reply({ embeds: [embed], components: [buttons] });
    } catch (err) {
      // Log: Error occurred in buy command
      logError(
        message.client,
        `Error in !buy command for ${message.author.tag}: ${err}`
      );
      await message.reply(
        "❌ An error occurred while processing your buy command."
      );
    }
  },
};
