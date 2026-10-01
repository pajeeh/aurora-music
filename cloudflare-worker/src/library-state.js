const validTrack=value=>value&&typeof value==='object'&&/^[\w-]{6,20}$/.test(value.id)&&typeof value.title==='string'&&value.title.trim()&&value.title.length<=200&&typeof value.artist==='string'&&value.artist.trim()&&value.artist.length<=200&&typeof value.album==='string'&&value.album.length<=200&&typeof value.duration==='string'&&value.duration.length<=30&&typeof value.artwork==='string'&&value.artwork.length<=1000&&typeof value.accent==='string'&&value.accent.length<=30;
const validCollection=value=>value&&typeof value==='object'&&typeof value.id==='string'&&/^[\w-]{1,80}$/.test(value.id)&&typeof value.title==='string'&&value.title.trim()&&value.title.length<=100&&Array.isArray(value.tracks)&&value.tracks.length<=200&&value.tracks.every(validTrack);

export function publicLibrary(state){return {likedTracks:Object.values(state?.likes??{}),collections:Object.values(state?.collections??{}),recent:Array.isArray(state?.recent)?state.recent:[],revision:Number(state?.revision??0)};}

export function applyLibraryAction(current,body){
  const state={likes:{...(current?.likes??{})},collections:{...(current?.collections??{})},recent:Array.isArray(current?.recent)?current.recent.slice(0,30):[],imported:Array.isArray(current?.imported)?current.imported.slice(-49):[],revision:Number(current?.revision??0)};
  if(body?.type==='import'){
    if(typeof body.deviceId!=='string'||!/^[\w-]{12,80}$/.test(body.deviceId))throw Object.assign(new Error('Dispositivo inválido.'),{status:400});
    if(!Array.isArray(body.tracks)||body.tracks.length>500)throw Object.assign(new Error('Biblioteca inválida.'),{status:400});
    if(body.collections!==undefined&&(!Array.isArray(body.collections)||body.collections.length>100||!body.collections.every(validCollection)))throw Object.assign(new Error('Playlists inválidas.'),{status:400});
    if(body.recent!==undefined&&(!Array.isArray(body.recent)||body.recent.length>30||!body.recent.every(validTrack)))throw Object.assign(new Error('Histórico inválido.'),{status:400});
    let changed=false;
    for(const track of body.tracks)if(validTrack(track)&&!state.likes[track.id]&&Object.keys(state.likes).length<1000){state.likes[track.id]=track;changed=true;}
    for(const collection of body.collections??[])if(!state.collections[collection.id]&&Object.keys(state.collections).length<100){state.collections[collection.id]=collection;changed=true;}
    for(const track of body.recent??[])if(!state.recent.some(item=>item.id===track.id)){state.recent.push(track);changed=true;}
    state.recent=state.recent.slice(0,30);
    if(!state.imported.includes(body.deviceId))state.imported.push(body.deviceId);
    if(changed)state.revision++;return state;
  }
  if(body?.type==='like'){
    if(typeof body.liked!=='boolean'||!validTrack(body.track))throw Object.assign(new Error('Curtida inválida.'),{status:400});
    if(body.liked){if(!state.likes[body.track.id]&&Object.keys(state.likes).length>=1000)throw Object.assign(new Error('Limite de curtidas atingido.'),{status:409});state.likes[body.track.id]=body.track;}else delete state.likes[body.track.id];
    state.revision++;return state;
  }
  if(body?.type==='collection'){
    if(!validCollection(body.collection))throw Object.assign(new Error('Playlist inválida.'),{status:400});
    if(!state.collections[body.collection.id]&&Object.keys(state.collections).length>=100)throw Object.assign(new Error('Limite de playlists atingido.'),{status:409});
    state.collections[body.collection.id]=body.collection;state.revision++;return state;
  }
  if(body?.type==='recent'){
    if(!validTrack(body.track))throw Object.assign(new Error('Faixa recente inválida.'),{status:400});
    state.recent=[body.track,...state.recent.filter(track=>track.id!==body.track.id)].slice(0,30);state.revision++;return state;
  }
  throw Object.assign(new Error('Ação inválida.'),{status:400});
}
