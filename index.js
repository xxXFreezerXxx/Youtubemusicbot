const { Client, GatewayIntentBits,REST,EmbedBuilder,ButtonBuilder, ButtonStyle,Events,ActionRowBuilder,Routes,Partials} = require('discord.js');
const { getVoiceConnection, joinVoiceChannel,createAudioPlayer, createAudioResource} =require("@discordjs/voice"); 
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // for guild related things
    GatewayIntentBits.GuildMembers, // for guild members related things
    GatewayIntentBits.GuildBans, // for manage guild bans
    GatewayIntentBits.GuildEmojisAndStickers, // for manage emojis and stickers
    GatewayIntentBits.GuildIntegrations, // for discord Integrations
    GatewayIntentBits.GuildWebhooks, // for discord webhooks
    GatewayIntentBits.GuildInvites, // for guild invite managing
    GatewayIntentBits.GuildVoiceStates, // for voice related things
    GatewayIntentBits.GuildPresences, // for user presence things
    GatewayIntentBits.GuildMessages, // for guild messages things
    GatewayIntentBits.GuildMessageReactions, // for message reactions things
    GatewayIntentBits.GuildMessageTyping, // for message typing things
    GatewayIntentBits.DirectMessages, // for dm messages
    GatewayIntentBits.DirectMessageReactions, // for dm message reaction
    GatewayIntentBits.DirectMessageTyping, // for dm message typinh
    GatewayIntentBits.MessageContent, // enable if you need message content things
    GatewayIntentBits.GuildVoiceStates
  ],
});
const fs = require('fs');
const play = require('play-dl');
const secret = require("dotenv").config().parsed;
const rest = new REST({ version: "10" }).setToken(secret.BOT_TOKEN);
const ffmpegPath = require("@ffmpeg-installer/ffmpeg");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath.path);
const ytsearch = require("yt-search");
client.on("interactionCreate",async(interaction)=>{
    if(interaction.isChatInputCommand()){
        const cmd = interaction.commandName;
        if(cmd==="youtube"){
            
            const videotitle = interaction.options.get("link").value;
            const videofinder = async (query)=>{
              const videoResult = await ytsearch(query);
  
              return (videoResult.videos.length>1) ? videoResult.videos[0] : null;
          }
          const link = await videofinder(videotitle);
          if(link){
            const voicechannel = interaction.member.voice.channelId;
            if(voicechannel){
                const VoiceConnection = await joinVoiceChannel({
                    channelId:voicechannel,
                    guildId: interaction.guildId,
                    adapterCreator:interaction.guild.voiceAdapterCreator,
                });
                const stream = await play.stream(link.url);
                const connection = getVoiceConnection(interaction.guildId);//1e
                const player = createAudioPlayer();
                const file = createAudioResource(stream.stream, {inputType: stream.type});

                VoiceConnection.subscribe(player);
                player.play(file);
                interaction.reply(`${link.title}を再生する`);
                player.addListener("stateChange", async (oldOne, newOne) => {
                  if(newOne.status=="idle"){
                    await player.stop();
                    await connection.destroy();
                  }
                })
            }

          }else{
            interaction.reply("そんなものはない");
          }
        }
    }
})

const {SlashCommandBuilder} = require("@discordjs/builders");
const main = ()=>{
  const commands = [
      (new SlashCommandBuilder().setName("youtube").setDescription("再生")
      .addStringOption(option =>
        option.setName('link')
          .setDescription('リンク貼れボケナス')
          .setRequired(true)
          )).toJSON(),
  ];
  rest.put(Routes.applicationGuildCommands(secret.CLIENT_ID,secret.GUILD_ID),{body:commands}).then(()=>
  client.login(secret.BOT_TOKEN)
  );
client.on("ready",()=>{
  console.log(client.user.username);
})
};
main();