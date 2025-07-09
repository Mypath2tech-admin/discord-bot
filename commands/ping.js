export default {
  name: "ping",
  description: "Test rate limiting with a simple ping command",
  async run({ message }) {
    const start = Date.now();
    const msg = await message.reply("🏓 Pinging...");
    const end = Date.now();

    await msg.edit(
      `🏓 Pong! Latency: ${end - start}ms | API Latency: ${Math.round(
        message.client.ws.ping
      )}ms`
    );
  },
};
