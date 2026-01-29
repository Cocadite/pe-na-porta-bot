
const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

async function fetchApproved() {
  const res = await fetch(config.API_BASE + "/bot/approved", {
    headers: {
      Authorization: "Bearer " + config.API_KEY
    }
  });
  return await res.json();
}

async function markDone(id) {
  await fetch(config.API_BASE + "/bot/mark-done", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + config.API_KEY
    },
    body: JSON.stringify({ id })
  });
}

async function processApprovals() {
  try {
    const data = await fetchApproved();
    if (!data.items) return;

    const guild = await client.guilds.fetch(config.GUILD_ID);

    for (const item of data.items) {
      try {
        const member = await guild.members.fetch(item.userId).catch(() => null);
        if (!member) continue;

        await member.roles.add(config.APPROVED_ROLE);
        await markDone(item.id);

        if (config.LOG_CHANNEL_ID) {
          const channel = await guild.channels.fetch(config.LOG_CHANNEL_ID).catch(() => null);
          if (channel) channel.send(`✅ Cargo aplicado para ${member.user.tag}`);
        }
      } catch (e) {
        console.error("Erro ao aplicar cargo:", e);
      }
    }
  } catch (err) {
    console.error("Erro API:", err);
  }
}

client.once("ready", () => {
  console.log("🤖 Bot Pe Na Porta ONLINE:", client.user.tag);
  setInterval(processApprovals, config.CHECK_INTERVAL_MS || 60000);
});

client.login(config.BOT_TOKEN);
