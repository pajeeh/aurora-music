const text=(value,max)=>String(value??'').trim().slice(0,max);

export function normalizeDiscordWebhookTrack(input){
  const track=input?.track;
  const id=text(track?.id,64);const title=text(track?.title,160);const artist=text(track?.artist,160);const album=text(track?.album,160);
  if(!/^[\w-]{6,20}$/.test(id)||!title||!artist)return null;
  const artwork=/^https:\/\//.test(track?.artwork??'')?text(track.artwork,500):'';
  return {id,title,artist,album,artwork};
}

export function discordWebhookPayload(input){
  const track=normalizeDiscordWebhookTrack(input);if(!track)return null;
  const url=`https://www.youtube.com/watch?v=${encodeURIComponent(track.id)}`;
  return {
    username:'Aurora Music',
    avatar_url:'https://pajeeh.github.io/aurora-music/aurora-icon.svg',
    allowed_mentions:{parse:[]},
    embeds:[{
      title:track.title,url,
      description:[track.artist,track.album].filter(Boolean).join(' · '),
      color:0x9b7cff,
      ...(track.artwork?{thumbnail:{url:track.artwork}}:{}),
      footer:{text:'Compartilhado pelo Aurora Music'},
      timestamp:new Date().toISOString()
    }]
  };
}

export function validDiscordWebhookUrl(value){
  try{const url=new URL(value);return url.protocol==='https:'&&['discord.com','discordapp.com'].includes(url.hostname)&&/^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/.test(url.pathname);}
  catch{return false;}
}
