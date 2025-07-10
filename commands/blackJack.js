const {client, GateWayInternBItes, GatewayIntentBits} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const token = DISCORD_TOKEN; // someone fix this later

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

