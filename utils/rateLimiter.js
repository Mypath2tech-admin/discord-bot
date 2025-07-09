/**
 * Advanced Rate Limiting System for Discord Bot
 * Prevents spam and abuse while allowing legitimate usage
 */

import { logWarn, logInfo } from "./logger.js";

/**
 * Rate limiter configuration
 */
const RATE_LIMIT_CONFIG = {
  // Global rate limits (per user across all commands)
  global: {
    maxRequests: 20, // Max requests per window
    windowMs: 60000, // 1 minute window
    blockDuration: 300000, // 5 minute block
  },

  // Per-command rate limits
  commands: {
    // Economy commands - moderate limits
    balance: { maxRequests: 10, windowMs: 60000 },
    bank: { maxRequests: 8, windowMs: 60000 },
    profile: { maxRequests: 5, windowMs: 60000 },
    shop: { maxRequests: 10, windowMs: 60000 },
    leaderboard: { maxRequests: 5, windowMs: 60000 },
    shield: { maxRequests: 5, windowMs: 60000 },
    stats: { maxRequests: 5, windowMs: 60000 },

    // Action commands - stricter limits
    work: { maxRequests: 2, windowMs: 60000 },
    daily: { maxRequests: 2, windowMs: 60000 },
    rob: { maxRequests: 3, windowMs: 60000 },
    send: { maxRequests: 5, windowMs: 60000 },
    buy: { maxRequests: 5, windowMs: 60000 },
    deposit: { maxRequests: 10, windowMs: 60000 },
    withdraw: { maxRequests: 10, windowMs: 60000 },
    gift: { maxRequests: 3, windowMs: 60000 },

    // Admin commands - very strict limits
    give: { maxRequests: 5, windowMs: 60000 },
    additem: { maxRequests: 3, windowMs: 60000 },
    edititem: { maxRequests: 5, windowMs: 60000 },
    removeitem: { maxRequests: 3, windowMs: 60000 },
    forcerob: { maxRequests: 2, windowMs: 60000 },
    clear: { maxRequests: 5, windowMs: 60000 },
    createroles: { maxRequests: 1, windowMs: 300000 }, // 5 minutes
    adddefaultitems: { maxRequests: 1, windowMs: 300000 },

    // Help and info commands - generous limits
    help: { maxRequests: 15, windowMs: 60000 },
    xp: { maxRequests: 8, windowMs: 60000 },
    ping: { maxRequests: 5, windowMs: 60000 }, // Test command

    // Button interactions - moderate limits
    button_deposit: { maxRequests: 10, windowMs: 60000 },
    button_withdraw: { maxRequests: 10, windowMs: 60000 },
    button_daily: { maxRequests: 2, windowMs: 60000 },
    button_work: { maxRequests: 2, windowMs: 60000 },
    button_profile: { maxRequests: 8, windowMs: 60000 },
    button_shop: { maxRequests: 8, windowMs: 60000 },
    button_leaderboard: { maxRequests: 5, windowMs: 60000 },
    button_balance: { maxRequests: 10, windowMs: 60000 },
  },
};

/**
 * In-memory storage for rate limiting data
 */
const rateLimitStore = new Map();
const globalLimitStore = new Map();
const blockedUsers = new Map();

/**
 * Rate limiting statistics
 */
const rateLimitStats = {
  totalRequests: 0,
  blockedRequests: 0,
  uniqueUsers: new Set(),

  getStats() {
    return {
      totalRequests: this.totalRequests,
      blockedRequests: this.blockedRequests,
      uniqueUsers: this.uniqueUsers.size,
      blockRate: this.totalRequests
        ? ((this.blockedRequests / this.totalRequests) * 100).toFixed(2) + "%"
        : "0%",
    };
  },
};

/**
 * Cleans up expired rate limit entries
 */
function cleanupExpiredEntries() {
  const now = Date.now();

  // Clean up command-specific rate limits
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }

  // Clean up global rate limits
  for (const [userId, data] of globalLimitStore.entries()) {
    if (now - data.resetTime > 0) {
      globalLimitStore.delete(userId);
    }
  }

  // Clean up blocked users
  for (const [userId, blockTime] of blockedUsers.entries()) {
    if (now - blockTime > RATE_LIMIT_CONFIG.global.blockDuration) {
      blockedUsers.delete(userId);
    }
  }
}

/**
 * Checks if a user is currently blocked
 * @param {string} userId - User ID
 * @returns {Object} Block status and remaining time
 */
function checkUserBlocked(userId) {
  const blockTime = blockedUsers.get(userId);
  if (!blockTime) return { blocked: false, remainingTime: 0 };

  const now = Date.now();
  const remainingTime =
    RATE_LIMIT_CONFIG.global.blockDuration - (now - blockTime);

  if (remainingTime <= 0) {
    blockedUsers.delete(userId);
    return { blocked: false, remainingTime: 0 };
  }

  return { blocked: true, remainingTime };
}

/**
 * Updates global rate limit for a user
 * @param {string} userId - User ID
 * @returns {boolean} Whether the request should be allowed
 */
function updateGlobalRateLimit(userId) {
  const now = Date.now();
  const config = RATE_LIMIT_CONFIG.global;

  if (!globalLimitStore.has(userId)) {
    globalLimitStore.set(userId, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  const data = globalLimitStore.get(userId);

  // Reset if window expired
  if (now >= data.resetTime) {
    data.count = 1;
    data.resetTime = now + config.windowMs;
    return true;
  }

  // Increment counter
  data.count++;

  // Check if limit exceeded
  if (data.count > config.maxRequests) {
    // Block user
    blockedUsers.set(userId, now);
    return false;
  }

  return true;
}

/**
 * Updates command-specific rate limit
 * @param {string} userId - User ID
 * @param {string} commandName - Command name
 * @returns {Object} Rate limit result
 */
function updateCommandRateLimit(userId, commandName) {
  const config = RATE_LIMIT_CONFIG.commands[commandName];
  if (!config) return { allowed: true, resetTime: 0 };

  const key = `${userId}:${commandName}`;
  const now = Date.now();

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, resetTime: now + config.windowMs };
  }

  const data = rateLimitStore.get(key);

  // Reset if window expired
  if (now >= data.resetTime) {
    data.count = 1;
    data.resetTime = now + config.windowMs;
    return { allowed: true, resetTime: data.resetTime };
  }

  // Increment counter
  data.count++;

  // Check if limit exceeded
  if (data.count > config.maxRequests) {
    return {
      allowed: false,
      resetTime: data.resetTime,
      remaining: data.resetTime - now,
      maxRequests: config.maxRequests,
    };
  }

  return { allowed: true, resetTime: data.resetTime };
}

/**
 * Main rate limiting function
 * @param {string} userId - User ID
 * @param {string} username - Username for logging
 * @param {string} commandName - Command name
 * @param {Object} client - Discord client for logging
 * @returns {Object} Rate limit result
 */
export function checkRateLimit(userId, username, commandName, client) {
  rateLimitStats.totalRequests++;
  rateLimitStats.uniqueUsers.add(userId);

  // Clean up expired entries periodically
  if (rateLimitStats.totalRequests % 100 === 0) {
    cleanupExpiredEntries();
  }

  // Check if user is blocked
  const blockStatus = checkUserBlocked(userId);
  if (blockStatus.blocked) {
    rateLimitStats.blockedRequests++;

    logWarn(client, `Rate limit: User ${username} (${userId}) is blocked`, {
      userId,
      username,
      commandName,
      remainingTime: blockStatus.remainingTime,
      reason: "user_blocked",
    });

    return {
      allowed: false,
      reason: "blocked",
      remainingTime: blockStatus.remainingTime,
      message: `🚫 You are temporarily blocked from using commands. Please wait ${Math.ceil(
        blockStatus.remainingTime / 1000 / 60
      )} minutes before trying again.`,
    };
  }

  // Check global rate limit
  if (!updateGlobalRateLimit(userId)) {
    rateLimitStats.blockedRequests++;

    logWarn(
      client,
      `Rate limit: User ${username} (${userId}) exceeded global limit`,
      {
        userId,
        username,
        commandName,
        reason: "global_limit_exceeded",
      }
    );

    return {
      allowed: false,
      reason: "global_limit",
      remainingTime: RATE_LIMIT_CONFIG.global.blockDuration,
      message: `🚫 You've exceeded the global command limit and have been temporarily blocked for ${
        RATE_LIMIT_CONFIG.global.blockDuration / 1000 / 60
      } minutes.`,
    };
  }

  // Check command-specific rate limit
  const commandResult = updateCommandRateLimit(userId, commandName);
  if (!commandResult.allowed) {
    rateLimitStats.blockedRequests++;

    logInfo(
      client,
      `Rate limit: User ${username} (${userId}) rate limited for command ${commandName}`,
      {
        userId,
        username,
        commandName,
        remainingTime: commandResult.remaining,
        maxRequests: commandResult.maxRequests,
        reason: "command_limit_exceeded",
      }
    );

    return {
      allowed: false,
      reason: "command_limit",
      remainingTime: commandResult.remaining,
      maxRequests: commandResult.maxRequests,
      message: `⏱️ You're using the \`${commandName}\` command too frequently. Please wait ${Math.ceil(
        commandResult.remaining / 1000
      )} seconds before trying again.`,
    };
  }

  return { allowed: true };
}

/**
 * Gets rate limiter statistics
 * @returns {Object} Statistics object
 */
export function getRateLimitStats() {
  return {
    ...rateLimitStats.getStats(),
    activeUsers: rateLimitStore.size,
    blockedUsers: blockedUsers.size,
    globalLimits: globalLimitStore.size,
  };
}

/**
 * Resets rate limits for a specific user (admin function)
 * @param {string} userId - User ID
 * @param {Object} client - Discord client for logging
 */
export function resetUserRateLimit(userId, client) {
  // Remove from all rate limit stores
  for (const [key] of rateLimitStore.entries()) {
    if (key.startsWith(`${userId}:`)) {
      rateLimitStore.delete(key);
    }
  }

  globalLimitStore.delete(userId);
  blockedUsers.delete(userId);

  logInfo(client, `Rate limits reset for user ${userId}`, {
    userId,
    action: "rate_limit_reset",
  });
}

/**
 * Gets rate limit info for a specific user
 * @param {string} userId - User ID
 * @returns {Object} User's rate limit status
 */
export function getUserRateLimitInfo(userId) {
  const info = {
    blocked: blockedUsers.has(userId),
    globalLimit: globalLimitStore.get(userId),
    commandLimits: {},
  };

  // Get command-specific limits
  for (const [key, data] of rateLimitStore.entries()) {
    if (key.startsWith(`${userId}:`)) {
      const commandName = key.split(":")[1];
      info.commandLimits[commandName] = data;
    }
  }

  return info;
}

// Clean up expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 300000);
