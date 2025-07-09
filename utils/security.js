/**
 * Enhanced Security & Moderation System
 * Anti-cheat, suspicious activity detection, automated moderation
 */

import { logWarn, logError, logCritical } from './logger.js';

/**
 * Security flags and thresholds
 */
const SECURITY_CONFIG = {
  MAX_COINS_PER_HOUR: 10000,
  MAX_COMMANDS_PER_MINUTE: 30,
  SUSPICIOUS_ACTIVITY_THRESHOLD: 5,
  AUTO_BAN_THRESHOLD: 10
};

/**
 * In-memory tracking for security
 */
const userActivity = new Map();
const suspiciousUsers = new Map();
const securityEvents = new Map();

/**
 * Tracks user activity for security monitoring
 */
export function trackUserActivity(userId, action, amount = 0) {
  const now = Date.now();
  const hourKey = Math.floor(now / (60 * 60 * 1000)); // Hour bucket
  
  if (!userActivity.has(userId)) {
    userActivity.set(userId, new Map());
  }
  
  const userStats = userActivity.get(userId);
  
  if (!userStats.has(hourKey)) {
    userStats.set(hourKey, {
      coinsEarned: 0,
      commandsUsed: 0,
      actions: [],
      startTime: now
    });
  }
  
  const hourStats = userStats.get(hourKey);
  hourStats.coinsEarned += amount;
  hourStats.commandsUsed++;
  hourStats.actions.push({ action, amount, timestamp: now });
  
  // Clean old data (keep only last 24 hours)
  const cutoffHour = hourKey - 24;
  for (const [hour] of userStats.entries()) {
    if (hour < cutoffHour) {
      userStats.delete(hour);
    }
  }
}

/**
 * Detects suspicious activity patterns
 */
export function detectSuspiciousActivity(userId, client) {
  if (!userActivity.has(userId)) return { suspicious: false };
  
  const userStats = userActivity.get(userId);
  const now = Date.now();
  const currentHour = Math.floor(now / (60 * 60 * 1000));
  const currentHourStats = userStats.get(currentHour);
  
  if (!currentHourStats) return { suspicious: false };
  
  const flags = [];
  
  // Check coins earned per hour
  if (currentHourStats.coinsEarned > SECURITY_CONFIG.MAX_COINS_PER_HOUR) {
    flags.push({
      type: 'excessive_earnings',
      details: `Earned ${currentHourStats.coinsEarned} coins in one hour`,
      severity: 'high'
    });
  }
  
  // Check command frequency
  const recentCommands = currentHourStats.actions.filter(
    action => now - action.timestamp < 60000
  ).length;
  
  if (recentCommands > SECURITY_CONFIG.MAX_COMMANDS_PER_MINUTE) {
    flags.push({
      type: 'command_spam',
      details: `${recentCommands} commands in last minute`,
      severity: 'medium'
    });
  }
  
  // Check for automation patterns (exact timing)
  const timings = currentHourStats.actions
    .slice(-10)
    .map((action, i, arr) => i > 0 ? action.timestamp - arr[i-1].timestamp : 0)
    .filter(timing => timing > 0);
  
  if (timings.length >= 5) {
    const avgTiming = timings.reduce((a, b) => a + b) / timings.length;
    const variance = timings.reduce((sum, timing) => sum + Math.pow(timing - avgTiming, 2), 0) / timings.length;
    
    // Very low variance suggests automation
    if (variance < 1000 && avgTiming < 5000) { // Less than 1 second variance, less than 5 second intervals
      flags.push({
        type: 'automation_pattern',
        details: `Highly regular timing pattern detected (variance: ${Math.round(variance)}ms)`,
        severity: 'high'
      });
    }
  }
  
  if (flags.length > 0) {
    recordSuspiciousActivity(userId, flags, client);
    return { suspicious: true, flags };
  }
  
  return { suspicious: false };
}

/**
 * Records suspicious activity
 */
function recordSuspiciousActivity(userId, flags, client) {
  if (!suspiciousUsers.has(userId)) {
    suspiciousUsers.set(userId, { count: 0, flags: [], firstSeen: Date.now() });
  }
  
  const userRecord = suspiciousUsers.get(userId);
  userRecord.count++;
  userRecord.flags.push(...flags);
  userRecord.lastSeen = Date.now();
  
  // Log the suspicious activity
  const highSeverityFlags = flags.filter(flag => flag.severity === 'high');
  
  if (highSeverityFlags.length > 0) {
    logWarn(client, `Suspicious activity detected for user ${userId}`, {
      userId,
      flags: flags.map(f => f.type),
      details: flags.map(f => f.details),
      suspiciousCount: userRecord.count,
      action: 'suspicious_activity_detected'
    });
  }
  
  // Auto-action for repeat offenders
  if (userRecord.count >= SECURITY_CONFIG.AUTO_BAN_THRESHOLD) {
    logCritical(client, `User ${userId} flagged for automatic ban - excessive suspicious activity`, {
      userId,
      totalFlags: userRecord.count,
      flagTypes: [...new Set(userRecord.flags.map(f => f.type))],
      action: 'auto_ban_recommended'
    });
  }
}

/**
 * Validates economy transactions
 */
export function validateTransaction(userId, type, amount, userData) {
  const errors = [];
  
  // Basic validation
  if (!userId || !type || amount === undefined) {
    errors.push('Missing required transaction parameters');
  }
  
  if (amount < 0) {
    errors.push('Negative amounts not allowed');
  }
  
  if (amount > 1000000) {
    errors.push('Transaction amount too large');
  }
  
  // Balance validation
  switch (type) {
    case 'spend':
    case 'withdraw':
      if (amount > userData.coins) {
        errors.push('Insufficient coins');
      }
      break;
    case 'bank_withdraw':
      if (amount > userData.bank) {
        errors.push('Insufficient bank balance');
      }
      break;
  }
  
  // Rate limiting validation
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (userActivity.has(userId)) {
    const currentHour = Math.floor(now / oneHour);
    const hourStats = userActivity.get(userId).get(currentHour);
    
    if (hourStats && hourStats.coinsEarned + amount > SECURITY_CONFIG.MAX_COINS_PER_HOUR) {
      errors.push('Hourly earning limit exceeded');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets security statistics
 */
export function getSecurityStats() {
  return {
    trackedUsers: userActivity.size,
    suspiciousUsers: suspiciousUsers.size,
    totalSecurityEvents: Array.from(suspiciousUsers.values()).reduce((sum, user) => sum + user.count, 0),
    highRiskUsers: Array.from(suspiciousUsers.values()).filter(user => user.count >= 5).length
  };
}

/**
 * Gets user security info
 */
export function getUserSecurityInfo(userId) {
  return {
    activity: userActivity.get(userId),
    suspicious: suspiciousUsers.get(userId),
    riskLevel: calculateRiskLevel(userId)
  };
}

/**
 * Calculates user risk level
 */
function calculateRiskLevel(userId) {
  const suspicious = suspiciousUsers.get(userId);
  if (!suspicious) return 'low';
  
  if (suspicious.count >= SECURITY_CONFIG.AUTO_BAN_THRESHOLD) return 'critical';
  if (suspicious.count >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) return 'high';
  return 'medium';
}

// Clean up old data every hour
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago
  
  for (const [userId, record] of suspiciousUsers.entries()) {
    if (record.lastSeen < cutoff) {
      suspiciousUsers.delete(userId);
    }
  }
}, 60 * 60 * 1000);
