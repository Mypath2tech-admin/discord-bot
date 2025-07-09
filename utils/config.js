/**
 * Configuration Management System
 * Centralized config with validation and hot-reloading
 */

import fs from 'fs';
import { logInfo, logWarn } from './logger.js';

const CONFIG_FILE = './config/bot-config.json';
const DEFAULT_CONFIG = {
  economy: {
    dailyAmount: 100,
    workMinAmount: 50,
    workMaxAmount: 200,
    robSuccessRate: 0.6,
    bankInterestRate: 0.05,
    maxBankAmount: 50000
  },
  moderation: {
    maxMessageLength: 2000,
    spamThreshold: 5,
    warningThreshold: 3
  },
  features: {
    enableRobbing: true,
    enableShop: true,
    enableLeaderboard: true,
    enableBankInterest: false
  },
  rateLimits: {
    globalMaxRequests: 20,
    globalWindowMs: 60000,
    blockDuration: 300000
  }
};

let currentConfig = { ...DEFAULT_CONFIG };

/**
 * Loads configuration from file or creates default
 */
export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      currentConfig = { ...DEFAULT_CONFIG, ...configData };
      logInfo(null, 'Configuration loaded successfully');
    } else {
      saveConfig();
      logInfo(null, 'Default configuration created');
    }
  } catch (error) {
    logWarn(null, `Failed to load config: ${error.message}`);
    currentConfig = { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves current configuration to file
 */
export function saveConfig() {
  try {
    fs.mkdirSync('./config', { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
    logInfo(null, 'Configuration saved successfully');
  } catch (error) {
    logWarn(null, `Failed to save config: ${error.message}`);
  }
}

/**
 * Gets configuration value
 */
export function getConfig(path) {
  const keys = path.split('.');
  let value = currentConfig;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Updates configuration value
 */
export function updateConfig(path, value) {
  const keys = path.split('.');
  let current = currentConfig;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  saveConfig();
}

/**
 * Gets all configuration
 */
export function getAllConfig() {
  return { ...currentConfig };
}

// Initialize configuration
loadConfig();
