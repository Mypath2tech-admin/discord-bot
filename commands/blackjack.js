// commands/blackjack.js
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { renderTable } from '../renderer.js';
import { getDb }       from '../handlers/db.js';

// ——— Helpers ———
export function createShuffledDeck() {
  const suits = ['hearts','diamonds','clubs','spades'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = suits.flatMap(s => ranks.map(r => ({ suit: s, rank: r })));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function calcValue(cards) {
  let sum = 0, aces = 0;
  for (const { rank } of cards) {
    if (rank === 'A') { aces++; sum += 1; }
    else if (['J','Q','K'].includes(rank)) sum += 10;
    else sum += +rank;
  }
  for (let i = 0; i < aces; i++) {
    if (sum + 10 <= 21) sum += 10;
  }
  return sum;
}

// ——— Command & Button Handler ———
export default {
  name: 'bj',
  description: 'Play Blackjack with your coins',

  // 1) initial !bj run
  run: async ({ message, userData }) => {
    const args = message.content.trim().split(/ +/);
    const bet  = parseInt(args[1], 10);
    if (!bet || bet <= 0) {
      return message.reply('❌ Usage: `!bj <amount>`');
    }

    const db    = await getDb();
    const users = db.collection('users');
    if ((userData.coins || 0) < bet) {
      return message.reply(`❌ You only have ${userData.coins} coins.`);
    }
    await users.updateOne(
      { userId: message.author.id },
      { $inc: { coins: -bet } }
    );

    // deal: 2 to player, 1 to dealer face-up
    const deck   = createShuffledDeck();
    const player = [ deck.pop() ];
    const dealer = [ deck.pop() ];

    // draw second for each so visuals show two, but dealer’s second is back
    player.push(deck.pop());
    dealer.push(deck.pop());

    // build images
    const playerFiles = player.map(c => `${c.rank.toLowerCase()}_of_${c.suit}.svg`);
    const dealerFiles = [
      `${dealer[0].rank.toLowerCase()}_of_${dealer[0].suit}.svg`,
      'back.svg'
    ];
    const buffer = await renderTable({ dealerFiles, playerFiles });

    // buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('bj_hit')
          .setLabel('Hit')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('bj_stand')
          .setLabel('Stand')
          .setStyle(ButtonStyle.Secondary)
      );

    // embed
    const embed = new EmbedBuilder()
      .setTitle(`🃏 Blackjack — ${message.author.username} bets ${bet}`)
      .setDescription('Click **Hit** or **Stand**.')
      .addFields(
        { name: 'Your Hand', value: `Value: ${calcValue(player)}`, inline: true },
        { name: 'Dealer',   value: `Value: ${calcValue([dealer[0]])}?`, inline: true }
      )
      .setImage('attachment://table.png');

    const sent = await message.reply({
      embeds: [embed],
      components: [row],
      files: [{ attachment: buffer, name: 'table.png' }]
    });

    // store game state
    if (!message.client.bjGames) message.client.bjGames = new Map();
    message.client.bjGames.set(message.author.id, {
      deck, player, dealer, bet, msg: sent
    });
  },

  // 2) button clicks
  buttonRun: async ({ interaction, users }) => {
    const game = interaction.client.bjGames?.get(interaction.user.id);
    if (!game) return false; // not a bj button for us

    const { deck, player, dealer, bet, msg } = game;
    let result, finished = false;

    if (interaction.customId === 'bj_hit') {
      // hit draws exactly one
      player.push(deck.pop());
      if (calcValue(player) > 21) {
        result = 'lose';
        finished = true;
      }
    } else if (interaction.customId === 'bj_stand') {
      // dealer reveals and plays to 17
      while (calcValue(dealer) < 17 && dealer.length < 3) {
        dealer.push(deck.pop());
      }
      const p = calcValue(player), d = calcValue(dealer);
      if (d > 21 || p > d)        result = 'win';
      else if (p < d)             result = 'lose';
      else                         result = 'push';
      finished = true;
    } else {
      return false;
    }

    // rebuild images
    const playerFiles = player.map(c => `${c.rank.toLowerCase()}_of_${c.suit}.svg`);
    const dealerFiles = finished
      ? dealer.map(c => `${c.rank.toLowerCase()}_of_${c.suit}.svg`)
      : [`${dealer[0].rank.toLowerCase()}_of_${dealer[0].suit}.svg`, 'back.svg'];
    const buffer = await renderTable({ dealerFiles, playerFiles });

    // settle
    const dbCol = (await getDb()).collection('users');
    if (finished) {
      if (result === 'win') {
        await dbCol.updateOne({ userId: interaction.user.id }, { $inc: { coins: bet * 2 } });
      } else if (result === 'push') {
        await dbCol.updateOne({ userId: interaction.user.id }, { $inc: { coins: bet } });
      }
    }

    // disable buttons when finished
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('bj_hit')
          .setLabel('Hit')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(finished),
        new ButtonBuilder()
          .setCustomId('bj_stand')
          .setLabel('Stand')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(finished)
      );

    const desc = finished
      ? result === 'win'  ? `✅ You win **${bet * 2}** coins!`
      :   result === 'lose' ? `❌ You lose **${bet}** coins.`
      :                       `😐 Push: returned **${bet}** coins.`
      : 'Click **Hit** or **Stand**.';

    // update embed
    const embed = new EmbedBuilder()
      .setTitle(`🃏 Blackjack — ${interaction.user.username}`)
      .setDescription(desc)
      .addFields(
        { name: 'Your Hand', value: `Value: ${calcValue(player)}`, inline: true },
        { name: 'Dealer', value: `Value: ${calcValue(finished ? dealer : [dealer[0]])}${finished ? '' : '?'}`, inline: true }
      )
      .setImage('attachment://table.png');

    await msg.edit({
      embeds: [embed],
      components: [row],
      files: [{ attachment: buffer, name: 'table.png' }]
    });

    if (finished) {
      interaction.client.bjGames.delete(interaction.user.id);
    }

    // acknowledge without sending a second reply
    await interaction.deferUpdate();
    return true;
  }
};
