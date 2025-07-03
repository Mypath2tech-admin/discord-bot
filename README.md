# 📌 MyPath2Tech Bot — Internal Dev README

**This is our internal team doc for the MyPath2Tech Discord Economy Bot.**
Core is live — here’s exactly what’s built, how it’s structured, and what’s left.

---

## ✅ What’s done

* MongoDB connected (Atlas)
* Base economy working:

  * `!balance` — wallet coins
  * `!bank` — wallet & bank, with GUI buttons (Deposit, Withdraw, Daily)
  * `!deposit <amount>` / `!withdraw <amount>` — typed commands
  * `!work` — earn coins
  * `!daily` — daily coins (typed + button)
  * `!send @user <amount>` — send coins
  * `!rob @user` — rob coins
  * `!leaderboard` — top 5 richest
* `buttonHandler.js` works for GUI logic

---

## 📂 Project Structure

```
mypath2tech-bot/
 ├─ index.js
 ├─ .env
 ├─ .gitignore
 ├─ package.json
 ├─ commands/
 │   ├─ balance.js
 │   ├─ work.js
 │   ├─ bank.js
 │   ├─ deposit.js
 │   ├─ withdraw.js
 │   ├─ send.js
 │   ├─ rob.js
 │   ├─ daily.js
 │   ├─ leaderboard.js
 │   ├─ (help.js) [TODO]
 │   ├─ (profile.js) [TODO]
 │   ├─ (shop.js) [TODO]
 │   ├─ (buy.js) [TODO]
 │   ├─ (shield.js) [TODO]
 ├─ handlers/
 │   ├─ buttonHandler.js
```

**MongoDB user doc:**

```json
{
  "userId": "123456789",
  "coins": 500,
  "bank": 1000,
  "lastDaily": 0
}
```

---

## ⚙️ How it works

* `index.js` dynamically loads `/commands`.
* Each command runs Mongo checks + updates wallet/bank.
* GUI buttons (in `!bank` embed) use `buttonHandler.js`.
* Same wallet/bank logic works for both typed & button actions.

---

## 🗂️ Dev TO DO
* Test all edge cases for `!send` + `!rob`
* Review DB writes for bugs
* Add cooldowns for `!work` + `!rob` (store last used timestamp in Mongo)
* Make `rob` respect shield
* Build starter `!shop` — store items in Mongo, `!shop` lists them
* Add `!shield` — user buys rob protection for coins, active for X hours

---

## 🚀 Running the bot

```bash
npm install
```

Create `.env`:

```
DISCORD_TOKEN=your-bot-token
MONGO_URI=your-mongo-uri
```

Run:

```bash
node index.js
```

Test in Discord:

* Text: `!balance`, `!work`, `!bank`
* Click GUI buttons in `!bank`

---

## ✅ Team Reminder

* Keep your commits clean.
* Test fully before pushing.
* Update this doc as new commands ship.

**Built by Matin + Dev Team**
