const {
  Client,
  GatewayIntentBits,
  ChannelType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

async function criarPartida(message, nome, limite) {
  const guild = message.guild;

  const canalTexto = await guild.channels.create({
    name: `${nome}-sala`,
    type: ChannelType.GuildText
  });

  const canalVoz = await guild.channels.create({
    name: `${nome.toUpperCase()} | Voz`,
    type: ChannelType.GuildVoice
  });

  const jogadores = [];

  await canalTexto.send(
    `🎮 **${nome.toUpperCase()} criada**\n` +
    `Digite **!entrar** estando em um canal de voz\n` +
    `(${jogadores.length}/${limite})`
  );

  const coletor = canalTexto.createMessageCollector({ time: 15 * 60 * 1000 });

  coletor.on("collect", async msg => {
    if (msg.content === "!entrar" && msg.member.voice.channel) {
      if (!jogadores.includes(msg.member.id)) {
        jogadores.push(msg.member.id);
        await msg.reply(`✅ Entrou (${jogadores.length}/${limite})`);
      }

      if (jogadores.length === limite) {
        coletor.stop();
        for (const id of jogadores) {
          const membro = await guild.members.fetch(id);
          if (membro.voice.channel) {
            membro.voice.setChannel(canalVoz);
          }
        }
        await canalTexto.send("🔒 Sala fechada!");
      }
    }
  });

  coletor.on("end", async () => {
    setTimeout(async () => {
      await canalTexto.delete().catch(() => {});
      await canalVoz.delete().catch(() => {});
    }, 5 * 60 * 1000);
  });
}

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (message.content === "!x1") criarPartida(message, "x1", 2);
  if (message.content === "!x2") criarPartida(message, "x2", 4);
  if (message.content === "!x4") criarPartida(message, "x4", 8);
});

client.login(process.env.TOKEN);
