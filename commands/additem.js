import { logInfo, logWarn, logError } from "../utils/logger.js"; // Log: Import logger utils

export default {
  name: "additem",
  description: "Admin-only: Add a new shop item",
  run: async ({ message, args, users }) => {
    try {
      // Log: Wrap logic in try/catch for error logging
      // Check admin perms
      if (!message.member.permissions.has("Administrator")) {
        logWarn(
          message.client,
          `User ${message.author.tag} tried to use !additem without admin permission.`
        );
        return message.reply(
          "❌ You do not have permission to use this command."
        );
      }

      const name = args[0];
      const price = parseInt(args[1]);
      const description = args.slice(2, args.length - 1).join(" ");
      const durationHours = parseInt(args[args.length - 1]);

      if (!name || isNaN(price) || price <= 0 || !description) {
        logWarn(
          message.client,
          `User ${message.author.tag} used !additem with invalid arguments.`
        );
        return message.reply(
          "Usage: `!additem <name> <price> <description> [durationHours]`"
        );
      }

      const db = users.s.db; // same DB from your users collection

      const itemDoc = {
        name,
        price,
        description,
      };

      // If durationHours is a valid number, add it
      if (!isNaN(durationHours) && durationHours > 0) {
        itemDoc.durationHours = durationHours;
      }

      await db.collection("shopItems").insertOne(itemDoc);

      // Log: Successful item addition
      logInfo(
        message.client,
        `Admin ${
          message.author.tag
        } added a new shop item: ${name} (Price: ${price}, Description: ${description}, Duration: ${
          durationHours || "N/A"
        }).`
      );

      return message.reply({
        embeds: [
          {
            title: "✅ Shop Item Added",
            description:
              `**Name:** ${name}\n` +
              `**Price:** ${price} coins\n` +
              `**Description:** ${description}\n` +
              (itemDoc.durationHours
                ? `**Duration:** ${itemDoc.durationHours} hour(s)`
                : ""),
            color: 0x00ae86,
          },
        ],
      });
    } catch (err) {
      // Log: Error occurred in additem command
      logError(
        message.client,
        `Error in !additem command for ${message.author.tag}: ${err}`
      );
      await message.reply(
        "❌ An error occurred while processing your additem command."
      );
    }
  },
};
