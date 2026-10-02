export function toDiscordActivity(presence,now=Date.now()){
  if(!presence)return null;const position=Math.max(0,Number(presence.position)||0);const duration=Math.max(position,Number(presence.duration)||0);const elapsed=Math.min(duration,position+Math.max(0,(now-Date.parse(presence.updatedAt))/1000));
  const activity={details:String(presence.track.title).slice(0,128),state:String(presence.track.artist).slice(0,128),largeImageKey:'aurora',largeImageText:'Aurora Music',instance:false,buttons:[{label:'Abrir o Aurora',url:'https://pajeeh.github.io/aurora-music/'}]};
  if(presence.playing&&duration>0){activity.startTimestamp=new Date(now-elapsed*1000);activity.endTimestamp=new Date(now+(duration-elapsed)*1000);}
  return activity;
}

export function activityKey(activity){return activity?JSON.stringify({...activity,startTimestamp:activity.startTimestamp?.toISOString(),endTimestamp:activity.endTimestamp?.toISOString()}):'clear';}
