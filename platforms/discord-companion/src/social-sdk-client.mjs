import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const companionRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const defaultHelperPath=path.join(companionRoot,'native-social-sdk','target','release','aurora-discord-social-sdk.exe');
export const defaultSdkBinPath=path.join(companionRoot,'vendor','discord_social_sdk','bin','release');

function timestamp(value){return value instanceof Date?value.getTime():undefined;}

export function toSocialSdkCommand(activity,id){
  if(!activity)return {command:'clear',id};
  const button=activity.buttons?.find(item=>item?.url);
  return {
    command:'set',id,title:activity.details||'Aurora Music',artist:activity.state||'Reproduzindo no Aurora',
    image:activity.largeImageKey||'aurora',start:timestamp(activity.startTimestamp),end:timestamp(activity.endTimestamp),
    url:button?.url||'https://pajeeh.github.io/aurora-music/'
  };
}

export function socialSdkAvailable(helperPath=defaultHelperPath,sdkBinPath=defaultSdkBinPath){
  return process.platform==='win32'&&fs.existsSync(helperPath)&&fs.existsSync(path.join(sdkBinPath,'discord_partner_sdk.dll'));
}

export async function createSocialSdkClient(appId,{helperPath=defaultHelperPath,sdkBinPath=defaultSdkBinPath,spawnProcess=spawn,responseTimeoutMs=8000}={}){
  const child=spawnProcess(helperPath,[appId],{stdio:['pipe','pipe','pipe'],windowsHide:true,env:{...process.env,PATH:`${sdkBinPath}${path.delimiter}${process.env.PATH||''}`}});
  let buffer='';let ready=false;let sequence=0;const pending=new Map();
  const rejectPending=error=>{for(const request of pending.values()){clearTimeout(request.timer);request.reject(error);}pending.clear();};
  const readyPromise=new Promise((resolve,reject)=>{
    const fail=error=>{if(!ready)reject(error instanceof Error?error:new Error(String(error)));};
    child.once('error',fail);child.once('exit',code=>fail(new Error(`Social SDK encerrou antes de iniciar (${code??'sem código'}).`)));
    child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{
      buffer+=chunk;let newline;
      while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline).trim();buffer=buffer.slice(newline+1);if(!line)continue;
        try{const event=JSON.parse(line);if(event.event==='ready'){ready=true;resolve();continue;}const request=pending.get(event.id);if(!request)continue;pending.delete(event.id);clearTimeout(request.timer);if(event.event==='updated'&&event.successful)request.resolve();else if(event.event==='cleared')request.resolve();else request.reject(new Error('O Discord recusou a atualização do Social SDK.'));}catch{console.error(`[Aurora] Resposta inesperada do Social SDK: ${line}`);}
      }
    });
    child.stderr.setEncoding('utf8');child.stderr.on('data',chunk=>console.error(`[Aurora Social SDK] ${chunk.trim()}`));
  });
  await readyPromise;
  child.once('exit',code=>rejectPending(new Error(`Social SDK encerrou (${code??'sem código'}).`)));
  child.once('error',rejectPending);
  const send=activity=>new Promise((resolve,reject)=>{
    const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('O Social SDK não confirmou a atualização a tempo.'));},responseTimeoutMs);timer.unref();pending.set(id,{resolve,reject,timer});
    child.stdin.write(`${JSON.stringify(toSocialSdkCommand(activity,id))}\n`,error=>{if(!error)return;pending.delete(id);clearTimeout(timer);reject(error);});
  });
  const destroy=()=>new Promise(resolve=>{
    if(child.exitCode!==null||child.killed)return resolve();
    const timer=setTimeout(()=>{if(child.exitCode===null)child.kill();resolve();},2000);timer.unref();
    child.once('exit',()=>{clearTimeout(timer);resolve();});child.stdin.end('{"command":"exit"}\n');
  });
  return {transport:'social-sdk',setActivity:send,clearActivity:()=>send(null),destroy};
}
