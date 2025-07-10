import { logInfo, logWarn, logError } from "../utils/logger.js"; // Log: Import logger utils
import { checkRateLimit } from "../utils/rateLimiter.js";

export default async function ({ interaction, users }) {
  const userId = interaction.user.id;

  try {
    // Check rate limits for button interactions
    const rateLimitResult = checkRateLimit(
      userId,
      interaction.user.tag,
      `button_${interaction.customId}`,
      interaction.client
    );

    if (!rateLimitResult.allowed) {
      await interaction.reply({
        content: rateLimitResult.message,
        ephemeral: true,
      });
      return;
    }
    // Log: Wrap logic in try/catch for error logging
    let userData = await users.findOne({ userId });
    if (!userData) {
      await users.insertOne({ userId, coins: 0, bank: 0, lastDaily: 0 });
      userData = { userId, coins: 0, bank: 0, lastDaily: 0 };
    }

    // Log: Button press
    logInfo(
      interaction.client,
      `Button pressed: ${interaction.customId} by ${interaction.user.tag}`,
      {
        userId: interaction.user.id,
        channelId: interaction.channel.id,
        guildId: interaction.guild?.id,
        buttonId: interaction.customId,
      }
    );

    switch (interaction.customId) {
      // === BANK BUTTONS ===
      case "deposit":
        if (userData.coins < 100) {
          return interaction.reply({
            content: "❌ Not enough wallet funds.",
            ephemeral: true,
          });
        }
        await users.updateOne({ userId }, { $inc: { coins: -100, bank: 100 } });
        return interaction.reply({
          content: "✅ Deposited 💵 100 coins.",
          ephemeral: true,
        });

      case "withdraw":
        if (userData.bank < 100) {
          return interaction.reply({
            content: "❌ Not enough bank funds.",
            ephemeral: true,
          });
        }
        await users.updateOne({ userId }, { $inc: { coins: 100, bank: -100 } });
        return interaction.reply({
          content: "✅ Withdrew 💸 100 coins.",
          ephemeral: true,
        });

      case "daily": {
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;
        if (now - (userData.lastDaily || 0) < cooldown) {
          return interaction.reply({
            content: "⏳ You already claimed your daily.",
            ephemeral: true,
          });
        }
        const reward = Math.floor(Math.random() * 200) + 100;
        await users.updateOne(
          { userId },
          { $inc: { coins: reward }, $set: { lastDaily: now } }
        );
        return interaction.reply({
          content: `✅ Claimed 💰 ${reward} daily coins!`,
          ephemeral: true,
        });
      }

      // === QUICK ACCESS SHORTCUTS ===
      case "open_profile":
        return interaction.reply({
          content: "👤 Type `!profile` to see your stats.",
          ephemeral: true,
        });

      case "do_work":
        return interaction.reply({
          content: "🛠️ Type `!work` to earn coins.",
          ephemeral: true,
        });

      case "open_shop":
        return interaction.reply({
          content: "🛒 Type `!shop` to open the shop.",
          ephemeral: true,
        });

      case "open_leaderboard":
        return interaction.reply({
          content: "🏆 Type `!leaderboard` to see the top players.",
          ephemeral: true,
        });

      case "show_logs": {
        // Example: Show the user's last 5 logs (customize as needed)
        const logs = await global.logsCollection
          ?.find({ userId })
          .sort({ timestamp: -1 })
          .limit(5)
          .toArray();

        if (!logs || logs.length === 0) {
          return interaction.reply({
            content: "No logs found for you.",
            ephemeral: true,
          });
        }

        const logText = logs
          .map(
            (log, i) =>
              `**${i + 1}.** [${log.level.toUpperCase()}] ${log.message} (${new Date(
                log.timestamp
              ).toLocaleString()})`
          )
          .join("\n");

        return interaction.reply({
          content: `📜 **Your Recent Logs:**\n${logText}`,
          ephemeral: true,
        });
      }

      default:
        // Log: Unknown button press
        logWarn(
          interaction.client,
          `Unknown button pressed: ${interaction.customId} by ${interaction.user.tag}`
        );
        return interaction.reply({
          content: "❌ Unknown button.",
          ephemeral: true,
        });
    }
  } catch (err) {
    // Log: Error occurred in button handler
    logError(
      interaction.client,
      `Error in buttonHandler for ${interaction.user.tag}: ${err}`
    );
    await interaction.reply({
      content: "❌ An error occurred while processing your action.",
      ephemeral: true,
    });
  }
}
