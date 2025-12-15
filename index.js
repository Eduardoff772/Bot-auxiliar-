const { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  PermissionsBitField 
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

async function criarPartida(message, tipo, limite) {
  const guild = message.guild;

  const canalTexto = await guild.channels.create({
    name: `${tipo}-aposta`,
    type: ChannelType.GuildText
  });

  const canalVoz = await guild.channels.create({
    name: `${tipo.toUpperCase()} | Partida`,
    type: ChannelType.GuildVoice
  });

  await canalTexto.send(
    `🎮 **${tipo.toUpperCase()} criada!**\n` +
    `👥 Limite: ${limite} jogadores\n` +
    `Entre em um canal de voz para ser movido automaticamente.`
  );

  const membros = [];

  const coletor = canalTexto.createMessageCollector({ time: 600000 });

  coletor.on("collect", async msg => {
    if (msg.content === "!entrar" && msg.member.voice.channel) {
      if (!membros.includes(msg.member.id)) {
        membros.push(msg.member.id);
        await msg.reply(`✅ Entrou (${membros.length}/${limite})`);
      }

      if (membros.length === limite) {
        coletor.stop();
        for (const id of membros) {
          const membro = await guild.members.fetch(id);
          if (membro.voice.channel) {
            membro.voice.setChannel(canalVoz);
          }
        }
        await canalTexto.send("🚨 Partida fechada!");
      }
    }
  });

  coletor.on("end", async () => {
    setTimeout(async () => {
      await canalTexto.delete();
      await canalVoz.delete();
    }, 300000);
  });
}

client.on("messageCreate", async message => {
  if (!message.content.startsWith("!")) return;

  if (message.content === "!x1") criarPartida(message, "x1", 2);
  if (message.content === "!x2") criarPartida(message, "x2", 4);
  if (message.content === "!x4") criarPartida(message, "x4", 8);
});

client.login(process.env.TOKEN);
