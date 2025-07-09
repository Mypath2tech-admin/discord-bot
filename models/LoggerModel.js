/**
 * Log Model Schema for MongoDB
 */

export const LogSchema = {
  level: {
    type: String,
    required: true,
    enum: ["debug", "info", "warn", "error", "critical"],
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  formattedMessage: {
    type: String,
    required: true,
  },
  botId: {
    type: String,
    required: false,
  },
  botName: {
    type: String,
    required: false,
  },
  userId: {
    type: String,
    required: false,
  },
  channelId: {
    type: String,
    required: false,
  },
  guildId: {
    type: String,
    required: false,
  },
  commandName: {
    type: String,
    required: false,
  },
  errorStack: {
    type: String,
    required: false,
  },
  severity: {
    type: Number,
    required: false,
    default: 1,
  },
  environment: {
    type: String,
    required: false,
    default: "production",
  },
};

/**
 * Creates a validated log document
 * @param {Object} logData - The log data
 * @returns {Object} Validated log document
 */
export function createLogDocument(logData) {
  const document = {
    level: logData.level || "info",
    message: logData.message || "",
    timestamp: logData.timestamp || new Date(),
    formattedMessage: logData.formattedMessage || "",
    botId: logData.botId || null,
    botName: logData.botName || null,
    userId: logData.userId || null,
    channelId: logData.channelId || null,
    guildId: logData.guildId || null,
    commandName: logData.commandName || null,
    errorStack: logData.errorStack || null,
    severity: logData.severity || getSeverityLevel(logData.level || "info"),
    environment: logData.environment || process.env.NODE_ENV || "production",
  };

  // Validate required fields
  if (!document.message) {
    throw new Error("Log message is required");
  }

  if (
    !["debug", "info", "warn", "error", "critical"].includes(document.level)
  ) {
    throw new Error(
      "Invalid log level. Must be debug, info, warn, error, or critical"
    );
  }

  return document;
}

/**
 * Gets severity level based on log level
 * @param {string} level - Log level
 * @returns {number} Severity level (1-5)
 */
function getSeverityLevel(level) {
  const severityMap = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    critical: 5,
  };
  return severityMap[level] || 2;
}

/**
 * Creates database indexes for optimal querying
 * @param {Collection} collection - MongoDB collection
 */
export async function createLogIndexes(collection) {
  try {
    await collection.createIndex({ timestamp: -1 }); // For date queries
    await collection.createIndex({ level: 1 }); // For level filtering
    await collection.createIndex({ userId: 1 }); // For user-specific logs
    await collection.createIndex({ commandName: 1 }); // For command-specific logs
    await collection.createIndex({ timestamp: -1, level: 1 }); // Compound index
    console.log("✅ Log collection indexes created");
  } catch (err) {
    console.error("❌ Failed to create log indexes:", err);
  }
}
