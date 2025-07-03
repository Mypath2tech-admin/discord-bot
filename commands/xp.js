import { EmbedBuilder } from 'discord.js';

export default {
  name: 'xp',
  description: 'Full XP system without noisy level-up messages',
  run: async ({ message, args, users }) => {
    const subcommand = args[0];
    const userId = message.author.id;
    let user = await users.findOne({ userId });

    if (!user) {
      await users.insertOne({ userId, xp: 0, level: 1, messages: 0, lastVoiceJoin: 0, voiceMinutes: 0 });
      user = { userId, xp: 0, level: 1, messages: 0, lastVoiceJoin: 0, voiceMinutes: 0 };
    }

    switch (subcommand) {
      case 'rank': {
        const embed = new EmbedBuilder()
          .setTitle(`${message.author.username}'s Rank`)
          .setDescription(`XP: ${user.xp}\nLevel: ${user.level}\nMessages: ${user.messages}\nVoice Minutes: ${user.voiceMinutes || 0}`)
          .setColor(0x00AE86);
        return message.reply({ embeds: [embed] });
      }

      case 'leaderboard': {
        const top = await users.find().sort({ xp: -1 }).limit(5).toArray();
        let desc = '';
        for (let i = 0; i < top.length; i++) {
          const member = await message.guild.members.fetch(top[i].userId).catch(() => null);
          const name = member ? member.user.username : 'Unknown';
          desc += `${i + 1}. ${name} — XP: ${top[i].xp}, Level: ${top[i].level}\n`;
        }
        const embed = new EmbedBuilder()
          .setTitle('Top 5 XP Leaderboard')
          .setDescription(desc)
          .setColor(0xFFD700);
        return message.reply({ embeds: [embed] });
      }

      case 'givexp': {
        if (!message.member.permissions.has('Administrator')) {
          return message.reply('You do not have permission.');
        }
        const target = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!target || isNaN(amount) || amount <= 0) {
          return message.reply('Usage: !xp givexp @user <amount>');
        }
        let targetData = await users.findOne({ userId: target.id });
        if (!targetData) {
          await users.insertOne({ userId: target.id, xp: amount, level: 1 });
        } else {
          await users.updateOne({ userId: target.id }, { $inc: { xp: amount } });
        }
        return message.reply(`Gave ${amount} XP to ${target.username}`);
      }

      case 'activityrole': {
        if (!message.member.permissions.has('Administrator')) {
          return message.reply('You do not have permission.');
        }
        const targetLevel = parseInt(args[1]);
        const roleName = args.slice(2).join(' ');
        if (isNaN(targetLevel) || !roleName) {
          return message.reply('Usage: !xp activityrole <level> <role name>');
        }
        if (user.level >= targetLevel) {
          const role = message.guild.roles.cache.find(r => r.name === roleName);
          if (role) {
            await message.member.roles.add(role);
            return message.reply(`You now have the ${roleName} role.`);
          } else {
            return message.reply('Role not found.');
          }
        } else {
          return message.reply(`You need to reach Level ${targetLevel} to get that role.`);
        }
      }

      default:
        return message.reply('Usage: !xp rank | leaderboard | givexp | activityrole');
    }
  }
};

export async function handleMessageXP({ message, users }) {
  if (message.author.bot) return;
  const userId = message.author.id;
  let user = await users.findOne({ userId });
  if (!user) {
    await users.insertOne({ userId, xp: 1, level: 1, messages: 1 });
    return;
  }
  const newXp = user.xp + 1;
  let newLevel = user.level;
  if (newXp >= user.level * 100) {
    newLevel += 1;
    await autoAssignLevelRoles(message, newLevel);
  }
  await users.updateOne(
    { userId },
    { $inc: { xp: 1, messages: 1 }, $set: { level: newLevel } }
  );
}

export async function handleVoiceXP({ oldState, newState, users }) {
  const userId = newState.member.user.id;
  let user = await users.findOne({ userId });
  if (!user) {
    await users.insertOne({ userId, xp: 0, level: 1, lastVoiceJoin: 0 });
    user = { xp: 0, level: 1, lastVoiceJoin: 0 };
  }
  const now = Date.now();
  if (!oldState.channel && newState.channel) {
    await users.updateOne({ userId }, { $set: { lastVoiceJoin: now } });
  }
  if (oldState.channel && !newState.channel) {
    const minutes = Math.floor((now - (user.lastVoiceJoin || now)) / 60000);
    if (minutes > 0) {
      const gainedXp = minutes;
      const newXp = user.xp + gainedXp;
      let newLevel = user.level;
      if (newXp >= user.level * 100) {
        newLevel += 1;
        await autoAssignLevelRoles(newState, newLevel);
      }
      await users.updateOne(
        { userId },
        {
          $inc: { xp: gainedXp, voiceMinutes: minutes },
          $set: { level: newLevel, lastVoiceJoin: 0 }
        }
      );
    }
  }
}

async function autoAssignLevelRoles(context, level) {
  const member = context.member || context.guild.members.cache.get(context.author.id);
  if (level === 5) {
    const role = member.guild.roles.cache.find(r => r.name === 'Active');
    if (role) await member.roles.add(role);
  }
  if (level === 10) {
    const role = member.guild.roles.cache.find(r => r.name === 'Super Active');
    if (role) await member.roles.add(role);
  }
  if (level === 20) {
    const role = member.guild.roles.cache.find(r => r.name === 'Knowledgeable');
    if (role) await member.roles.add(role);
  }
}
