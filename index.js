import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import { logInfo, logWarn, logError, clearOldLogs } from "./utils/logger.js";
import { checkRateLimit } from "./utils/rateLimiter.js";
import { createLogIndexes } from "./models/LoggerModel.js";
import { loadConfig } from "./utils/config.js";
import { trackUserActivity, detectSuspiciousActivity, validateTransaction } from "./utils/security.js";
import { recordCommandExecution, startPeriodicHealthChecks } from "./utils/monitoring.js";
import { processAllBankInterest } from "./utils/economy.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Load configuration
loadConfig();

// Check required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN is not set in the .env file.");
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not set in the .env file.");
  process.exit(1);
}

if (!process.env.LOG_CHANNEL_ID) {
  console.warn(
    "⚠️ LOG_CHANNEL_ID is not set in the .env file. Logs will be sent to console only."
  );
}

const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const mongoClient = new MongoClient(process.env.MONGO_URI);
let users;
let logsCollection;

const commands = new Map();

// Dynamic command loader
const commandFiles = fs
  .readdirSync("./commands")
  .filter((f) => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = await import(`./commands/${file}`);
  commands.set(cmd.default.name, cmd.default);
}

// Load button handler
const buttonHandler = (await import("./handlers/buttonHandler.js")).default;

async function startBot() {
  try {
    console.log("🚀 Starting bot...");

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoClient.connect();
    console.log("✅ MongoDB connected");

    const db = mongoClient.db("economyBot");
    users = db.collection("users");
    logsCollection = db.collection("logs");

    // Make logsCollection globally available for logger
    global.logsCollection = logsCollection;

    // Test the database connection
    await db.admin().ping();
    console.log("✅ Database ping successful");

    // Clean up old logs (keep logs for 30 days)
    await clearOldLogs(30);

    // Create database indexes for optimal querying
    await createLogIndexes(logsCollection);

    // Start periodic health checks
    startPeriodicHealthChecks(client, 30);

    // Start bank interest processing (every 24 hours)
    setInterval(async () => {
      await processAllBankInterest(users, client);
    }, 24 * 60 * 60 * 1000);

    logInfo(client, "✅ MongoDB connected and verified successfully");

    // Log bot login attempt
    console.log("🔐 Logging into Discord...");
    await client.login(process.env.DISCORD_TOKEN);
    console.log("✅ Bot logged in to Discord");
  } catch (err) {
    console.error("❌ Failed to start the bot:", err.message);

    // Log specific error details
    if (err.message.includes("Invalid token")) {
      console.error(
        "❌ Invalid Discord token. Please check your DISCORD_TOKEN in .env file."
      );
    } else if (err.message.includes("MongoServerError")) {
      console.error(
        "❌ MongoDB connection failed. Please check your MONGO_URI in .env file."
      );
    }

    // Attempt to log error if possible
    try {
      logError(client, `❌ Failed to start the bot: ${err.message}`);
    } catch (logErr) {
      console.error("❌ Could not log error to Discord:", logErr.message);
    }

    process.exit(1); // Exit the process if the bot fails to start
  }
}

// Log Bot Startup
client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);
  console.log(`🌐 Bot is active in ${client.guilds.cache.size} guild(s)`);
  console.log(`📋 Loaded ${commands.size} command(s)`);
  console.log("✅ Bot is fully operational!");

  logInfo(
    client,
    `🤖 Bot started as ${client.user.tag} and is fully operational`
  );
});

// Command Handling
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  try {
    const startTime = Date.now();
    
    // Check rate limits before processing command
    const rateLimitResult = checkRateLimit(
      message.author.id,
      message.author.tag,
      commandName,
      client
    );

    if (!rateLimitResult.allowed) {
      // Record failed command attempt
      recordCommandExecution(commandName, Date.now() - startTime, false);
      
      // Send rate limit message to user
      await message.reply({
        content: rateLimitResult.message,
        allowedMentions: { repliedUser: false },
      });
      return;
    }

    // Track user activity for security monitoring
    trackUserActivity(message.author.id, `command_${commandName}`, 0);

    logInfo(
      client,
      `Command used: ${message.content} by ${message.author.tag} in #${message.channel.name}`,
      {
        userId: message.author.id,
        channelId: message.channel.id,
        guildId: message.guild?.id,
        commandName: commandName,
      }
    );

    // Ensure user exists in database
    let userData = await users.findOne({ userId: message.author.id });
    if (!userData) {
      await users.insertOne({
        userId: message.author.id,
        coins: 0,
        bank: 0,
        lastDaily: 0,
        lastWork: 0,
        lifetimeEarned: 0,
        createdAt: new Date(),
      });
      userData = {
        userId: message.author.id,
        coins: 0,
        bank: 0,
        lastDaily: 0,
        lastWork: 0,
        lifetimeEarned: 0,
        createdAt: new Date(),
      };
      logInfo(
        client,
        `New user added to the database: ${message.author.tag} (${message.author.id})`
      );
    }

    const command = commands.get(commandName);
    if (command) {
      try {
        await command.run({ message, users, userData, args, client });
        
        // Record successful command execution
        const executionTime = Date.now() - startTime;
        recordCommandExecution(commandName, executionTime, true);
        
        // Check for suspicious activity after command execution
        const suspiciousResult = detectSuspiciousActivity(message.author.id, client);
        if (suspiciousResult.suspicious) {
          // Suspicious activity detected - already logged in detectSuspiciousActivity
        }
      } catch (err) {
        const executionTime = Date.now() - startTime;
        recordCommandExecution(commandName, executionTime, false);
        
        console.error(`❌ Error in command "${commandName}":`, err);
        logError(
          client,
          `Error in command "${commandName}" by ${message.author.tag}: ${err.message}`,
          {
            userId: message.author.id,
            commandName,
            errorStack: err.stack
          }
        );

        // Send user-friendly error message
        await message.reply(
          `❌ An error occurred while executing the \`${commandName}\` command. Please try again later.`
        );
      }
    } else {
      const executionTime = Date.now() - startTime;
      recordCommandExecution(commandName, executionTime, false);
      
      logWarn(
        client,
        `Unknown command attempted: ${commandName} by ${message.author.tag}`,
        {
          userId: message.author.id,
          commandName
        }
      );
    }
  } catch (err) {
    console.error("❌ Error in message handler:", err);
    logError(client, `Error in message handler: ${err.message}`);
  }
});

// Button Interaction Handling
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    try {
      logInfo(
        client,
        `Button pressed: ${interaction.customId} by ${interaction.user.tag} in #${interaction.channel.name}`,
        {
          userId: interaction.user.id,
          channelId: interaction.channel.id,
          guildId: interaction.guild?.id,
          buttonId: interaction.customId,
        }
      );
      await buttonHandler({ interaction, users });
    } catch (err) {
      console.error("❌ Error in button handler:", err);
      logError(
        client,
        `Error in button handler for ${interaction.user.tag}: ${err.message}`
      );

      // Send user-friendly error message
      try {
        await interaction.reply({
          content:
            "❌ An error occurred while processing your action. Please try again later.",
          ephemeral: true,
        });
      } catch (replyErr) {
        console.error("❌ Could not send error reply:", replyErr);
      }
    }
  }
});

// Global Error Logging
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
  logError(
    client,
    `Unhandled promise rejection: ${error.message}\n${error.stack}`
  );
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  logError(client, `Uncaught exception: ${error.message}\n${error.stack}`);

  // Graceful shutdown
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down bot gracefully...");

  try {
    logInfo(client, "🛑 Bot shutting down gracefully");
    await mongoClient.close();
    console.log("✅ MongoDB connection closed");
    client.destroy();
    console.log("✅ Discord client destroyed");
    console.log("👋 Bot shutdown complete");
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
  } finally {
    process.exit(0);
  }
});

// Start the bot
startBot();
