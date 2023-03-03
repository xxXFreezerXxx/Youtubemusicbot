//autopause
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
let queue = [];
const play = require('play-dl');
const secret = require("dotenv").config().parsed;
const rest = new REST({ version: "10" }).setToken(secret.BOT_TOKEN);
const ffmpegPath = require("@ffmpeg-installer/ffmpeg");
const ffmpeg = require("fluent-ffmpeg");
let playnumber = 0;
let isplaying=false;
ffmpeg.setFfmpegPath(ffmpegPath.path);
const ytsearch = require("yt-search");
let playmode="normal";
setInterval(() => {
}, 10000);
client.on("interactionCreate",async(interaction)=>{
    if(interaction.isChatInputCommand()){
        const cmd = interaction.commandName;
        if(cmd==="youtube"){
          interaction.deferReply().then(async ()=>{
            const videotitle = interaction.options.get("link").value;
            const videofinder = async (query)=>{
              const videoResult = await ytsearch(query);
  
              return (videoResult.videos.length>1) ? videoResult.videos[0] : null;
          }
          const link = await videofinder(videotitle);
          if(link){
            queue.push({title:link.title,channel:link.author,link:link.url,user:interaction.user.username});
            const voicechannel = interaction.member.voice.channelId;
            if(voicechannel){
                const VoiceConnection = await joinVoiceChannel({
                    channelId:voicechannel,
                    guildId: interaction.guildId,
                    adapterCreator:interaction.guild.voiceAdapterCreator,
                });
                let stream;
                let connection;
                let player;
                let file;
                if(!isplaying){
                  interaction.editReply(`${link.title}を再生する`);
                  stream = await play.stream(link.url);
                  connection = getVoiceConnection(interaction.guildId);//1e
                  player = createAudioPlayer();
                  file = createAudioResource(stream.stream, {inputType: stream.type});
  
                  VoiceConnection.subscribe(player);
                  player.play(file);
                  isplaying=true;
                  player.addListener("stateChange", async (oldOne, newOne) => {
                    if(newOne.status=="autopause"){
                      player.configureNetworking();
                    }
                    if(newOne.status=="idle"){
                      if(playmode=="normal"){
                        queue.splice(playnumber,1);

                      }
                      if(playmode=="repeatall"){
                        playnumber=(playnumber+1)%queue.length;
                      }
                      if(playmode=="shuffle"){
                        playnumber=Math.floor(Math.random()*queue.length);
                      }
                      if(queue.length==0){
                        isplaying=false;
                        await player.stop();
                        await connection.destroy();
                    }else{
                      stream = await play.stream(queue[playnumber].link);
                      file = createAudioResource(stream.stream, {inputType: stream.type});
                      player.play(file);
                    }
                    }
                    })
                  
                }else{
                  interaction.editReply(`${link.title}をキューに入れた`);
                }

          }else{
            interaction.editReply("そんなものはない");
          }
        }
            
          })}
        if(cmd=="queue"){
          const embed = new EmbedBuilder().setTitle("キュー").setDescription("**キュー数**: "+queue.length)
          for(let i=0;i<queue.length;i++){
            embed.addFields({name:`${i+1}. ${queue[i].title}`,value:`Creator: [${queue[i].channel.name}](${queue[i].channel.url}) | [Video link](${queue[i].link}) | Added by ${queue[i].user}`})
          }
          interaction.reply("kyu-");
          interaction.channel.send({embeds:[embed]});
        }
        if(cmd=="playmode"){
          playmode=interaction.options.get("mode").value;
          interaction.reply(`${interaction.options.get("mode").value}にした`);
        }
}
})

const {SlashCommandBuilder} = require("@discordjs/builders");
const main = ()=>{
  const commands = [
      (new SlashCommandBuilder().setName("youtube").setDescription("再生")
      .addStringOption(option =>
        option.setName('link')
          .setDescription('リンクかタイトルか')
          .setRequired(true)
          )).toJSON(),
          (new SlashCommandBuilder().setName("queue").setDescription("キューを表示")).toJSON(),
          (new SlashCommandBuilder().setName("playmode").setDescription("再生方法を選ぶ").addStringOption(option =>
            option.setName('mode')
              .setDescription('モード')
              .setRequired(true)
              .addChoices(
                { name: '普通', value: 'normal' },
                { name: '1曲リピート', value: 'repeatone' },
                { name: '全曲リピート', value: 'repeatall' },
                { name: "シャッフル",value:"shuffle"}
              )))

  ];
  rest.put(Routes.applicationGuildCommands(secret.CLIENT_ID,secret.GUILD_ID),{body:commands}).then(()=>
  client.login(secret.BOT_TOKEN)
  );
client.on("ready",()=>{
  console.log(client.user.username);
})
};
main();