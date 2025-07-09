# 📌 MyPath2Tech Bot — Internal Dev README

**Internal dev documentation for the MyPath2Tech Discord Economy Bot.**

---

## ✅ Features

### **Core Economy Commands**

- `!balance` → check wallet/bank (embed + buttons)
- `!bank` → view bank/wallet, Deposit/Withdraw/Daily/Profile buttons
- `!deposit` / `!withdraw` → move funds
- `!work` → earn coins, 1h cooldown, embed + buttons
- `!daily` → daily coins, 24h cooldown, embed + buttons with streak bonuses
- `!send @user <amount>` → send coins
- `!rob @user` → rob coins (respects shield)
- `!leaderboard` → Top 5, buttons for Profile/Work/Daily
- `!profile` → stats, cooldowns, shield status, buttons for Daily/Work/Shop
- `!shield` → check shield status, Open Shop button
- `!shop` → list shop items (Mongo)
- `!buy <item>` → buy item, deduct coins, activate shield

### **Advanced Features**

- `!achievements` → view achievement progress and unlocked rewards
- `!status` → comprehensive bot statistics and performance metrics
- `!ping` → latency test command
- **Achievement System** → unlock rewards for milestones (first coins, streaks, work count)
- **Daily Streaks** → bonus rewards for consecutive daily claims
- **Bank Interest** → automatic daily interest on bank deposits
- **Enterprise Logging System** → MongoDB, Discord, console with performance monitoring
- **Advanced Rate Limiting** → prevents spam and abuse with configurable limits
- **Security Monitoring** → anti-cheat, suspicious activity detection
- **Performance Tracking** → system metrics, health checks, command analytics
- `buttonHandler.js` → handles all GUI actions

### **Admin Commands**

- `!additem` → add shop item
- `!give @user <amount>` → grant coins
- `!clear` → clear messages
- `!forcerob` → test auto rob
- `!admin health` → comprehensive system health check
- `!admin metrics` → detailed performance metrics
- `!admin security [user]` → security overview and user risk analysis
- `!admin config show/set` → manage bot configuration
- `!config show/set/get` → configuration management
- `!ratelimit stats` → view rate limiting statistics
- `!ratelimit reset @user` → reset user's rate limits
- `!ratelimit info [@user]` → check rate limit status

---

## 📁 Structure

```
/ (root)
├── index.js                 # Main bot entry point
├── .env                    # Environment variables
├── .gitignore
├── package.json
├── config/
│   └── bot-config.json     # Bot configuration settings
├── commands/
│   ├── balance.js, bank.js, deposit.js, withdraw.js
│   ├── work.js, daily.js, send.js, rob.js
│   ├── leaderboard.js, profile.js, shield.js
│   ├── shop.js, buy.js, achievements.js
│   ├── admin.js, config.js, status.js, ping.js
│   ├── ratelimit.js, additem.js, give.js
│   └── forcerob.js, clear.js
├── handlers/
│   └── buttonHandler.js    # GUI button interactions
├── utils/
│   ├── logger.js          # Enterprise logging system
│   ├── rateLimiter.js     # Advanced rate limiting
│   ├── security.js        # Security monitoring
│   ├── monitoring.js      # Performance tracking
│   ├── economy.js         # Achievement & economy features
│   └── config.js          # Configuration management
├── models/
│   └── LoggerModel.js     # Log schema and validation
└── test/
    ├── setup.js           # Test environment configuration
    └── utils/             # Unit tests for all core systems
        ├── economy.test.js
        ├── logger.test.js
        ├── monitoring.test.js
        ├── rateLimiter.test.js
        └── security.test.js
```

**User document:**

```json
{
  "userId": "123456",
  "coins": 500,
  "bank": 1000,
  "lastDaily": 0,
  "lastWork": 0,
  "lastRob": 0,
  "shieldUntil": 0
}
```

**Shop item:**

```json
{
  "name": "shield",
  "price": 500,
  "description": "Rob protection",
  "durationHours": 6
}
```

---

## ⚙️ Usage

Install:

```bash
npm install
```

```bash
npm install dayjs
```

`.env`:

```env
DISCORD_TOKEN=your-token
MONGO_URI=your-mongo-url
LOG_CHANNEL_ID=your-log-channel-id
LOG_LEVEL=info
NODE_ENV=production
```

Run:

```bash
node index.js
```

### 🧪 Testing

Run the comprehensive test suite:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode (auto-rerun)
npm run test:coverage # Coverage reports
```

**Test Coverage:** Rate limiting, logging, security, monitoring, economy systems

---

## ✅ Dev Tasks

### ✅ Completed Features

- ✅ **Enterprise Logging System** - MongoDB, Discord, console with performance monitoring
- ✅ **Advanced Rate Limiting** - Spam prevention with configurable limits
- ✅ **Security Monitoring** - Anti-cheat and suspicious activity detection
- ✅ **Performance Tracking** - System metrics and health checks
- ✅ **Achievement System** - Unlockable rewards and milestones
- ✅ **Configuration Management** - Hot-reloadable config system
- ✅ **Admin Tools** - Comprehensive management commands
- ✅ **Comprehensive Test Suite** - Unit tests for all core systems with Mocha + Chai

### 🚧 In Progress

- Log button actions

### 📋 Future Enhancements

- Per-item Buy buttons
- Add 0-duration items (VIP)
- Link VIP role on buy
- Deploy on Railway

✅ **Keep code modular, commit tested code, update README.**

---

## 🚀 Credits

### © Matin & Team — 2025
