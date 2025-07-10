# 📚 Models & Functions Guide

**Quick reference for database models and utility functions.**

---

## 📊 Database Models

### **User Document**

```json
{
  "userId": "123456789012345678",
  "coins": 1500,
  "bank": 5000,
  "lastDaily": 1704067200000,
  "lastWork": 1704070800000,
  "shieldUntil": 1704071400000,
  "dailyStreak": 7,
  "workCount": 45,
  "lifetimeEarned": 15000,
  "achievements": ["first_coins", "hard_worker"]
}
```

### **Shop Item**

```json
{
  "name": "shield",
  "price": 500,
  "description": "Protection from robberies",
  "durationHours": 6,
  "emoji": "🛡️",
  "vipOnly": false,
  "roleId": null
}
```

---

## 🛠️ Utility Functions

### **Logger Functions**

```javascript
import { logInfo, logWarn, logError } from './utils/logger.js';

logInfo(client, 'User claimed daily', { userId, amount: 500 });
logWarn(client, 'Suspicious activity', { userId });
logError(client, 'Database failed', error);
```

### **Rate Limiter Functions**

```javascript
import { checkRateLimit, resetUserRateLimit } from './utils/rateLimiter.js';

const result = checkRateLimit(userId, userTag, 'daily', client);
if (!result.allowed) return interaction.reply({ content: result.message });

resetUserRateLimit(userId); // Admin function
```

### **Security Functions**

```javascript
import { validateTransaction, detectSuspiciousActivity } from './utils/security.js';

const validation = validateTransaction(userId, 'work', 500, userData);
if (!validation.valid) return interaction.reply({ content: validation.reason });

const suspicious = detectSuspiciousActivity(userId, client);
```

### **Economy Functions**

```javascript
import { checkAchievements, calculateDailyStreak, ACHIEVEMENTS } from './utils/economy.js';

const newAchievements = await checkAchievements(users, userId, userData, client);
const streak = calculateDailyStreak(userData);
const firstCoins = ACHIEVEMENTS.FIRST_COINS; // { id, name, reward }
```

### **Configuration Functions**

```javascript
import { getConfig, setConfig } from './utils/config.js';

const dailyAmount = getConfig('economy.dailyAmount'); // 500
setConfig('economy.dailyAmount', 600);
```

### **Monitoring Functions**

```javascript
import { recordCommandExecution, getSystemMetrics } from './utils/monitoring.js';

recordCommandExecution('daily', executionTime, true);
const metrics = getSystemMetrics(); // { memory, uptime, cpu }
```

---

## 📋 Command Template

```javascript
import { logInfo, logError } from '../utils/logger.js';
import { checkRateLimit } from '../utils/rateLimiter.js';

export default async function({ interaction, users }) {
  const userId = interaction.user.id;
  
  try {
    // Rate limit check
    const rateLimit = checkRateLimit(userId, interaction.user.tag, 'command', interaction.client);
    if (!rateLimit.allowed) {
      return interaction.reply({ content: rateLimit.message, ephemeral: true });
    }
    
    // Get/create user
    let user = await users.findOne({ userId });
    if (!user) {
      await users.insertOne({ userId, coins: 0, bank: 0 });
      user = { userId, coins: 0, bank: 0 };
    }
    
    // Command logic here
    
    logInfo(interaction.client, 'Command success', { userId, command: 'name' });
    
  } catch (error) {
    logError(interaction.client, 'Command failed', error);
    return interaction.reply({ content: '❌ Error occurred', ephemeral: true });
  }
}
```

---

## ⚙️ Configuration Reference

```json
{
  "economy": {
    "dailyAmount": 500,
    "workAmount": 300,
    "maxRobAmount": 1000
  },
  "rateLimit": {
    "globalLimit": 60,
    "commandLimits": { "daily": 1, "work": 3 }
  },
  "features": {
    "enableBankInterest": true,
    "enableAchievements": true
  }
}
```

---

## 🚀 Credits

**© Matin & Team — 2025**
