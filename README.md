# 📌 MyPath2Tech Bot — Internal Dev README

**Internal dev documentation for the MyPath2Tech Discord Economy Bot.**

---

## ✅ Features

* `!balance` → check wallet/bank (embed + buttons)
* `!bank` → view bank/wallet, Deposit/Withdraw/Daily/Profile buttons
* `!deposit` / `!withdraw` → move funds
* `!work` → earn coins, 1h cooldown, embed + buttons
* `!daily` → daily coins, 24h cooldown, embed + buttons
* `!send @user <amount>` → send coins
* `!rob @user` → rob coins (respects shield)
* `!leaderboard` → Top 5, buttons for Profile/Work/Daily
* `!profile` → stats, cooldowns, shield status, buttons for Daily/Work/Shop
* `!shield` → check shield status, Open Shop button
* `!shop` → list shop items (Mongo)
* `!buy <item>` → buy item, deduct coins, activate shield
* `buttonHandler.js` → handles all GUI actions
* !stats command
* edit item
* remove item
* lifetime stats
* leaderboard sorted by lifetime earned
* `!tax`
* `!gift`
* bank interest

**Admin:**

* `!additem` → add shop item
* `!give @user <amount>` → grant coins
* `!clear` → clear messages
* `!forcerob` → test auto rob

---

## 📁 Structure

```
/ (root)
├── index.js
├── .env
├── .gitignore
├── package.json
├── commands/
│   ├── balance.js, bank.js, deposit.js, withdraw.js, work.js, daily.js, send.js
│   ├── rob.js, leaderboard.js, profile.js, shield.js, shop.js, buy.js
│   ├── additem.js, give.js, forcerob.js, clear.js
├── handlers/
│   ├── buttonHandler.js
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
```

Run:

```bash
node index.js
```

---

## ✅ Dev Tasks

### 3 Testing
* Log button actions
### 6–10 Shop

* Per-item Buy buttons
* Add 0-duration items (VIP)
* Link VIP role on buy

### 16–20 Infra

* Spam rate limit
* Unit tests
* Deploy on Railway

✅ **Keep code modular, commit tested code, update README.**

**© Matin & Team — 2025 🚀**
