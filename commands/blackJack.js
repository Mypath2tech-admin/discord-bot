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

function createDeck(){
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = [];
}

for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
        return deck;
    }

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function getHandValue(hand){
    let value = 0;
    let aces = 0;

  for (const card of hand) {
    const rank = card.slice(0, -1);
    if (["J", "Q", "K"].includes(rank)) value += 10;
    else if (rank === "A") {
      value += 11;
      aces++;
    } else {
      value += parseInt(rank);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!blackjack") {
    const deck = createDeck();
    shuffle(deck);

    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    let playerTotal = getHandValue(playerHand);
    let dealerTotal = getHandValue(dealerHand);

    let msg = `🃏 **Blackjack Game**\n`;
    msg += `Your hand: ${playerHand.join(", ")} (Total: ${playerTotal})\n`;
    msg += `Dealer shows: ${dealerHand[0]}\n`;
    msg += `Type \`hit\` or \`stand\`.`;

    await message.channel.send(msg);

    const filter = m => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 30000 });

    collector.on("collect", m => {
      if (m.content.toLowerCase() === "hit") {
        playerHand.push(deck.pop());
        playerTotal = getHandValue(playerHand);
        m.channel.send(`You drew: ${playerHand[playerHand.length - 1]} (Total: ${playerTotal})`);

        if (playerTotal > 21) {
          m.channel.send("💥 You busted! Game over.");
          collector.stop();
        }
      } else if (m.content.toLowerCase() === "stand") {
        while (dealerTotal < 17) {
          dealerHand.push(deck.pop());
          dealerTotal = getHandValue(dealerHand);
        }

        let finalMsg = `Dealer hand: ${dealerHand.join(", ")} (Total: ${dealerTotal})\n`;
        if (dealerTotal > 21 || playerTotal > dealerTotal) {
          finalMsg += "🎉 You win!";
        } else if (playerTotal < dealerTotal) {
          finalMsg += "😞 Dealer wins.";
        } else {
          finalMsg += "🤝 It's a tie!";
        }

        m.channel.send(finalMsg);
        collector.stop();
      }
    });
  }
});

client.login(token);