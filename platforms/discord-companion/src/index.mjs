import fs from 'node:fs/promises';import os from 'node:os';import process from 'node:process';import readline from 'node:readline/promises';
import {activityKey,toDiscordActivity} from './activity.mjs';
import {protectSecret,unprotectSecret} from './secrets.mjs';
import {createSocialSdkClient,socialSdkAvailable} from './social-sdk-client.mjs';
import {appId,configDir,configPath,endpoint} from './settings.mjs';

async function readConfig(){try{return JSON.parse(await fs.readFile(configPath,'utf8'));}catch{return {};}}
async function saveConfig(value){await fs.mkdir(configDir,{recursive:true});await fs.writeFile(configPath,JSON.stringify(value,null,2),{mode:0o600});}
async function createRpcClient(){const {default:DiscordRPC}=await import('discord-rpc');DiscordRPC.register(appId);const rpc=new DiscordRPC.Client({transport:'ipc'});await new Promise((resolve,reject)=>{rpc.once('ready',resolve);rpc.once('error',reject);void rpc.login({clientId:appId}).catch(reject);});return {transport:'rpc',setActivity:value=>rpc.setActivity(value),clearActivity:()=>rpc.clearActivity(),destroy:()=>rpc.destroy()};}
async function createDiscordClient(){if(process.env.AURORA_DISCORD_TRANSPORT!=='rpc'&&socialSdkAvailable()){try{return await createSocialSdkClient(appId);}catch(error){console.error(`[Aurora] Social SDK indisponível (${error.message}); usando RPC.`);}}return createRpcClient();}
async function pair(input){const code=(input||'').replace(/\s/g,'');if(!/^\d{8}$/.test(code))throw new Error('Use o código de 8 dígitos exibido pelo Aurora.');const response=await fetch(`${endpoint}/api/presence/pair/claim`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,deviceName:`${os.hostname()} · Discord`})});const value=await response.json();if(!response.ok)throw new Error(value.error||'Não foi possível parear.');await saveConfig({protectedToken:protectSecret(value.token)});console.log('Aurora conectado. Agora execute npm start.');}
async function main(){
  if(process.argv[2]==='pair'){let value=process.argv[3];if(!value){const terminal=readline.createInterface({input:process.stdin,output:process.stdout});value=await terminal.question('Código exibido no Aurora: ');terminal.close();}return pair(value);}
  const config=await readConfig();if(!config.protectedToken)throw new Error('Este PC ainda não foi pareado. Execute npm run pair.');const deviceToken=unprotectSecret(config.protectedToken);
  const rpc=await createDiscordClient();let last='';let timer;
  async function sync(){try{const response=await fetch(`${endpoint}/api/presence/device`,{headers:{Authorization:`Bearer ${deviceToken}`}});if(response.status===401)throw new Error('Pareamento revogado. Execute npm run pair novamente.');if(!response.ok)throw new Error('Aurora Presence indisponível.');const value=await response.json();const activity=toDiscordActivity(value.presence);const key=activityKey(activity);if(key!==last){if(activity)await rpc.setActivity(activity);else await rpc.clearActivity();last=key;}}catch(error){console.error(`[Aurora] ${error.message}`);}}
  console.log(`Aurora está exibindo sua música no Discord via ${rpc.transport==='social-sdk'?'Social SDK oficial':'RPC compatível'}.`);void sync();timer=setInterval(()=>void sync(),5000);
  const close=async()=>{clearInterval(timer);try{await rpc.clearActivity();await rpc.destroy();}finally{process.exit(0);}};process.on('SIGINT',close);process.on('SIGTERM',close);
}
main().catch(error=>{console.error(`Aurora Discord Companion: ${error.message}`);process.exitCode=1;});
