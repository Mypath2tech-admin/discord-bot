import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const PREFIX = '!';
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

const mongoClient = new MongoClient(process.env.MONGO_URI);
let users;

const commands = new Map();

// Dynamic command loader
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = await import(`./commands/${file}`);
  commands.set(cmd.default.name, cmd.default);
}

// Load button handler
const buttonHandler = (await import('./handlers/buttonHandler.js')).default;

async function startBot() {
  await mongoClient.connect();
  console.log('✅ MongoDB connected');
  const db = mongoClient.db('economyBot');
  users = db.collection('users');

  client.login(process.env.DISCORD_TOKEN);
}

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  let userData = await users.findOne({ userId: message.author.id });
  if (!userData) {
    await users.insertOne({ userId: message.author.id, coins: 0, bank: 0, lastDaily: 0 });
    userData = { userId: message.author.id, coins: 0, bank: 0, lastDaily: 0 };
  }

  const command = commands.get(commandName);
  if (command) {
    command.run({ message, users, userData, args, client });
  }
});

// GUI buttons
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    buttonHandler({ interaction, users });
  }
});

startBot();
