const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField
} = require("discord.js");
const QRCode = require("qrcode");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== CONFIGURAÇÕES =====
const PIX_CHAVE = process.env.PIX_CHAVE;

// valores por modo
const VALORES = {
  x1: "10.00",
  x2: "20.00",
  x4: "40.00"
};
// ========================

client.once("ready", () => {
  console.log("💰 Bot auxiliar de pagamento ONLINE");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const comando = message.content.toLowerCase();

  if (!["!x1", "!x2", "!x4"].includes(comando)) return;

  const tipo = comando.replace("!", ""); // x1, x2, x4
  const valor = VALORES[tipo];

  // cria canal provisório
  const canalPagamento = await message.guild.channels.create({
    name: `💰-pagamento-${tipo}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: message.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: message.author.id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }
    ]
  });

  // payload Pix SIMPLES (funciona, mas manual)
  const payloadPix = `00020126580014BR.GOV.BCB.PIX0136${PIX_CHAVE}5204000053039865405${valor.replace(
    ".",
    ""
  )}5802BR5909APOSTA6009BRASIL62070503***6304`;

  const qrCode = await QRCode.toDataURL(payloadPix);

  await canalPagamento.send({
    content: `💸 **Pagamento ${tipo.toUpperCase()}**  
Valor: **R$ ${valor}**

Escaneie o QR Code abaixo para pagar 👇`,
    files: [
      {
        attachment: Buffer.from(qrCode.split(",")[1], "base64"),
        name: "pix.png"
      }
    ]
  });

  // opcional: aviso no canal original
  await message.reply(
    `✅ Canal de pagamento criado: ${canalPagamento}`
  );
});

client.login(process.env.TOKEN);
