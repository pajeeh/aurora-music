const validTrack=value=>value&&typeof value==='object'&&/^[\w-]{6,20}$/.test(value.id)&&typeof value.title==='string'&&value.title.trim()&&value.title.length<=200&&typeof value.artist==='string'&&value.artist.trim()&&value.artist.length<=200&&typeof value.album==='string'&&value.album.length<=200&&typeof value.duration==='string'&&value.duration.length<=30&&typeof value.artwork==='string'&&value.artwork.length<=1000&&typeof value.accent==='string'&&value.accent.length<=30;

export function publicLibrary(state){return {likedTracks:Object.values(state?.likes??{}),revision:Number(state?.revision??0)};}

export function applyLibraryAction(current,body){
  const state={likes:{...(current?.likes??{})},imported:Array.isArray(current?.imported)?current.imported.slice(-49):[],revision:Number(current?.revision??0)};
  if(body?.type==='import'){
    if(typeof body.deviceId!=='string'||!/^[\w-]{12,80}$/.test(body.deviceId))throw Object.assign(new Error('Dispositivo inválido.'),{status:400});
    if(state.imported.includes(body.deviceId))return state;
    if(!Array.isArray(body.tracks)||body.tracks.length>500)throw Object.assign(new Error('Biblioteca inválida.'),{status:400});
    for(const track of body.tracks)if(validTrack(track)&&Object.keys(state.likes).length<1000)state.likes[track.id]=track;
    state.imported.push(body.deviceId);state.revision++;return state;
  }
  if(body?.type==='like'){
    if(typeof body.liked!=='boolean'||!validTrack(body.track))throw Object.assign(new Error('Curtida inválida.'),{status:400});
    if(body.liked){if(!state.likes[body.track.id]&&Object.keys(state.likes).length>=1000)throw Object.assign(new Error('Limite de curtidas atingido.'),{status:409});state.likes[body.track.id]=body.track;}else delete state.likes[body.track.id];
    state.revision++;return state;
  }
  throw Object.assign(new Error('Ação inválida.'),{status:400});
}
