import dayjs from "dayjs";
import { createLogDocument } from "../models/LoggerModel.js";

/**
 * Log levels with priority (higher number = more severe)
 */
export const LOG_LEVELS = {
  debug: { priority: 0, emoji: "🔍", color: 0x808080 },
  info: { priority: 1, emoji: "📝", color: 0x00ae86 },
  warn: { priority: 2, emoji: "⚠️", color: 0xffaa00 },
  error: { priority: 3, emoji: "❌", color: 0xff0000 },
  critical: { priority: 4, emoji: "🚨", color: 0x8b0000 },
};

/**
 * Current log level threshold (only log messages with priority >= this level)
 */
let currentLogLevel = process.env.LOG_LEVEL || "info";

/**
 * Rate limiting for log messages (prevent spam)
 */
const logCache = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SAME_LOGS = 5; // Max same logs per window

/**
 * Checks if a log message should be rate limited
 * @param {string} message - The log message
 * @param {string} level - The log level
 * @returns {boolean} True if should be logged, false if rate limited
 */
function shouldLogMessage(message, level) {
  const key = `${level}:${message}`;
  const now = Date.now();

  if (!logCache.has(key)) {
    logCache.set(key, { count: 1, firstSeen: now, lastSeen: now });
    return true;
  }

  const entry = logCache.get(key);

  // Reset if outside window
  if (now - entry.firstSeen > RATE_LIMIT_WINDOW) {
    logCache.set(key, { count: 1, firstSeen: now, lastSeen: now });
    return true;
  }

  entry.count++;
  entry.lastSeen = now;

  // Allow critical errors through rate limiting
  if (level === "critical") {
    return true;
  }

  return entry.count <= MAX_SAME_LOGS;
}

/**
 * Sets the minimum log level to display
 * @param {string} level - The minimum log level
 */
export function setLogLevel(level) {
  if (LOG_LEVELS[level]) {
    currentLogLevel = level;
    console.log(`📝 Log level set to: ${level}`);
  } else {
    console.error(`❌ Invalid log level: ${level}`);
  }
}

/**
 * Sends a log message to the Discord logs channel, console, and MongoDB database.
 * @param {Client} client - The Discord client.
 * @param {string} message - The message to log.
 * @param {'debug'|'info'|'warn'|'error'|'critical'} [level='info'] - Log level.
 * @param {Object} [metadata={}] - Additional metadata for the log
 */
export async function logToChannel(
  client,
  message,
  level = "info",
  metadata = {}
) {
  // Check if log level meets minimum threshold
  const logLevelConfig = LOG_LEVELS[level];
  const currentLevelConfig = LOG_LEVELS[currentLogLevel];

  if (
    !logLevelConfig ||
    logLevelConfig.priority < currentLevelConfig.priority
  ) {
    return; // Skip logging if below threshold
  }

  // Check rate limiting
  if (!shouldLogMessage(message, level)) {
    return; // Skip logging if rate limited
  }

  const logChannelId = process.env.LOG_CHANNEL_ID;
  const emoji = logLevelConfig.emoji;
  const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const content = `${emoji} [${timestamp}] ${message}`;
  
  const startTime = Date.now();
  let success = true;

  try {
    // Always log to console (with colors in development)
    if (process.env.NODE_ENV === "development") {
      const colors = {
        debug: "\x1b[90m", // Gray
        info: "\x1b[36m", // Cyan
        warn: "\x1b[33m", // Yellow
        error: "\x1b[31m", // Red
        critical: "\x1b[41m", // Red background
        reset: "\x1b[0m", // Reset
      };
      console.log(`${colors[level]}${content}${colors.reset}`);
    } else {
      console.log(content);
    }

    // Save to MongoDB database with retry logic
    await saveLogToDatabase(client, level, message, content, logLevelConfig, metadata);

    // Send to Discord channel (if available) - only for warn, error, critical
    if (logChannelId && ["warn", "error", "critical"].includes(level)) {
      await sendToDiscordChannel(client, level, message, content, logLevelConfig, metadata);
    }
  } catch (err) {
    success = false;
    console.error("Logger error:", err);
  } finally {
    const responseTime = Date.now() - startTime;
    logPerformance.updateStats(responseTime, success);
  }
}

/**
 * Saves log to MongoDB with retry logic
 */
async function saveLogToDatabase(client, level, message, content, logLevelConfig, metadata, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (global.logsCollection) {
        const logDocument = createLogDocument({
          level,
          message,
          timestamp: new Date(),
          formattedMessage: content,
          botId: client?.user?.id || "unknown",
          botName: client?.user?.tag || "unknown",
          severity: logLevelConfig.priority,
          environment: process.env.NODE_ENV || "production",
          ...metadata,
        });

        await global.logsCollection.insertOne(logDocument);
        return; // Success
      }
    } catch (err) {
      console.error(`Database log attempt ${attempt} failed:`, err);
      if (attempt === retries) {
        throw err; // Re-throw on final attempt
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * Sends log to Discord channel with retry logic
 */
async function sendToDiscordChannel(client, level, message, content, logLevelConfig, metadata, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        // For critical errors, send as embed for better visibility
        if (level === "critical") {
          const embed = {
            title: "🚨 CRITICAL ERROR",
            description: message,
            color: logLevelConfig.color,
            timestamp: new Date().toISOString(),
            fields: metadata.errorStack
              ? [
                  {
                    name: "Stack Trace",
                    value: `\`\`\`${metadata.errorStack.slice(0, 1000)}\`\`\``,
                  },
                ]
              : [],
          };
          await channel.send({ embeds: [embed] });
        } else {
          await channel.send(content);
        }
        return; // Success
      }
    } catch (err) {
      console.error(`Discord log attempt ${attempt} failed:`, err);
      if (attempt === retries) {
        // Don't throw - Discord logging is not critical
        console.error("Failed to send log to Discord after all retries");
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Logs a debug message.
 * @param {Client} client
 * @param {string} message
 * @param {Object} [metadata={}] - Additional metadata for the log
 */
export async function logDebug(client, message, metadata = {}) {
  await logToChannel(client, message, "debug", metadata);
}

/**
 * Logs an info message.
 * @param {Client} client
 * @param {string} message
 * @param {Object} [metadata={}] - Additional metadata for the log
 */
export async function logInfo(client, message, metadata = {}) {
  await logToChannel(client, message, "info", metadata);
}

/**
 * Logs a warning message.
 * @param {Client} client
 * @param {string} message
 * @param {Object} [metadata={}] - Additional metadata for the log
 */
export async function logWarn(client, message, metadata = {}) {
  await logToChannel(client, message, "warn", metadata);
}

/**
 * Logs an error message.
 * @param {Client} client
 * @param {string|Error} error
 * @param {Object} [metadata={}] - Additional metadata for the log
 */
export async function logError(client, error, metadata = {}) {
  const msg = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : null;

  await logToChannel(client, msg, "error", {
    ...metadata,
    errorStack,
  });
}

/**
 * Logs a critical error message.
 * @param {Client} client
 * @param {string|Error} error
 * @param {Object} [metadata={}] - Additional metadata for the log
 */
export async function logCritical(client, error, metadata = {}) {
  const msg = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : null;

  await logToChannel(client, msg, "critical", {
    ...metadata,
    errorStack,
  });
}

/**
 * Retrieves logs from the database with optional filtering.
 * @param {Object} options - Query options
 * @param {string} [options.level] - Filter by log level (debug, info, warn, error, critical)
 * @param {Date} [options.startDate] - Filter logs from this date
 * @param {Date} [options.endDate] - Filter logs until this date
 * @param {string} [options.userId] - Filter by user ID
 * @param {string} [options.commandName] - Filter by command name
 * @param {number} [options.limit=100] - Maximum number of logs to retrieve
 * @param {number} [options.skip=0] - Number of logs to skip (for pagination)
 * @returns {Promise<Array>} Array of log documents
 */
export async function getLogs(options = {}) {
  try {
    if (!global.logsCollection) {
      throw new Error("Logs collection not initialized");
    }

    const query = {};

    if (options.level) {
      query.level = options.level;
    }

    if (options.userId) {
      query.userId = options.userId;
    }

    if (options.commandName) {
      query.commandName = options.commandName;
    }

    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        query.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        query.timestamp.$lte = options.endDate;
      }
    }

    return await global.logsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 100)
      .toArray();
  } catch (err) {
    console.error("Failed to retrieve logs from database:", err);
    return [];
  }
}

/**
 * Gets log statistics for monitoring and analytics.
 * @param {Object} options - Query options
 * @param {Date} [options.startDate] - Start date for statistics
 * @param {Date} [options.endDate] - End date for statistics
 * @returns {Promise<Object>} Log statistics
 */
export async function getLogStats(options = {}) {
  try {
    if (!global.logsCollection) {
      throw new Error("Logs collection not initialized");
    }

    const matchStage = {};
    if (options.startDate || options.endDate) {
      matchStage.timestamp = {};
      if (options.startDate) matchStage.timestamp.$gte = options.startDate;
      if (options.endDate) matchStage.timestamp.$lte = options.endDate;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 },
          latestLog: { $max: "$timestamp" },
        },
      },
    ];

    const results = await global.logsCollection.aggregate(pipeline).toArray();

    const stats = {
      total: 0,
      byLevel: {},
      lastActivity: null,
    };

    results.forEach((result) => {
      stats.byLevel[result._id] = {
        count: result.count,
        latestLog: result.latestLog,
      };
      stats.total += result.count;

      if (!stats.lastActivity || result.latestLog > stats.lastActivity) {
        stats.lastActivity = result.latestLog;
      }
    });

    return stats;
  } catch (err) {
    console.error("Failed to get log statistics:", err);
    return { total: 0, byLevel: {}, lastActivity: null };
  }
}

/**
 * Clears old logs from the database (older than specified days).
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {Promise<number>} Number of deleted logs
 */
export async function clearOldLogs(daysToKeep = 30) {
  try {
    if (!global.logsCollection) {
      throw new Error("Logs collection not initialized");
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await global.logsCollection.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(
      `🗑️ Cleared ${result.deletedCount} old logs (older than ${daysToKeep} days)`
    );
    return result.deletedCount;
  } catch (err) {
    console.error("Failed to clear old logs:", err);
    return 0;
  }
}

/**
 * Performs health check on logging system
 * @param {Client} client - Discord client
 * @returns {Promise<Object>} Health check results
 */
export async function checkLoggerHealth(client) {
  const health = {
    status: 'healthy',
    checks: {},
    timestamp: new Date()
  };

  // Check MongoDB connection
  try {
    if (global.logsCollection) {
      await global.logsCollection.findOne({}, { limit: 1 });
      health.checks.database = { status: 'healthy', message: 'Database connection OK' };
    } else {
      health.checks.database = { status: 'unhealthy', message: 'Database collection not initialized' };
      health.status = 'unhealthy';
    }
  } catch (err) {
    health.checks.database = { status: 'unhealthy', message: `Database error: ${err.message}` };
    health.status = 'unhealthy';
  }

  // Check Discord channel
  try {
    if (process.env.LOG_CHANNEL_ID) {
      const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        health.checks.discord = { status: 'healthy', message: 'Discord channel accessible' };
      } else {
        health.checks.discord = { status: 'warning', message: 'Discord channel not accessible' };
      }
    } else {
      health.checks.discord = { status: 'warning', message: 'Discord logging not configured' };
    }
  } catch (err) {
    health.checks.discord = { status: 'warning', message: `Discord error: ${err.message}` };
  }

  // Check performance
  const perfStats = getLoggerStats();
  if (perfStats.successRate && parseFloat(perfStats.successRate) < 95) {
    health.checks.performance = { status: 'warning', message: `Low success rate: ${perfStats.successRate}` };
  } else {
    health.checks.performance = { status: 'healthy', message: `Success rate: ${perfStats.successRate}` };
  }

  return health;
}

/**
 * Cleans up old log cache entries to prevent memory leaks
 */
function cleanupLogCache() {
  const now = Date.now();
  for (const [key, entry] of logCache.entries()) {
    if (now - entry.lastSeen > RATE_LIMIT_WINDOW * 2) {
      logCache.delete(key);
    }
  }
}

// Clean up cache every 5 minutes
setInterval(cleanupLogCache, 300000);

/**
 * Performance monitoring for logger
 */
const logPerformance = {
  totalLogs: 0,
  avgResponseTime: 0,
  failedLogs: 0,

  updateStats(responseTime, success = true) {
    this.totalLogs++;
    if (!success) this.failedLogs++;

    // Calculate rolling average
    this.avgResponseTime =
      ((this.avgResponseTime * (this.totalLogs - 1)) + responseTime) /
      this.totalLogs;
  },

  getStats() {
    return {
      totalLogs: this.totalLogs,
      avgResponseTime: Math.round(this.avgResponseTime * 100) / 100,
      failedLogs: this.failedLogs,
      successRate:
        this.totalLogs !== 0
          ? ((this.totalLogs - this.failedLogs) / this.totalLogs) * 100
          : 0,
    };
  },
};

/**
 * Gets logger performance statistics
 * @returns {Object} Performance statistics
 */
export function getLoggerStats() {
  return logPerformance.getStats();
}

/**
 * Creates a contextual logger that automatically includes common metadata
 * @param {Client} client - Discord client
 * @param {Object} context - Common context (user, guild, channel, command)
 * @returns {Object} Contextual logger functions
 */
export function createContextualLogger(client, context = {}) {
  const baseMetadata = {
    userId: context.user?.id,
    userName: context.user?.tag,
    guildId: context.guild?.id,
    guildName: context.guild?.name,
    channelId: context.channel?.id,
    channelName: context.channel?.name,
    commandName: context.commandName,
    ...context.metadata
  };

  return {
    debug: (message, metadata = {}) => logDebug(client, message, { ...baseMetadata, ...metadata }),
    info: (message, metadata = {}) => logInfo(client, message, { ...baseMetadata, ...metadata }),
    warn: (message, metadata = {}) => logWarn(client, message, { ...baseMetadata, ...metadata }),
    error: (error, metadata = {}) => logError(client, error, { ...baseMetadata, ...metadata }),
    critical: (error, metadata = {}) => logCritical(client, error, { ...baseMetadata, ...metadata })
  };
}
