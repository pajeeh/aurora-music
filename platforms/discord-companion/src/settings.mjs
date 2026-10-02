import os from 'node:os';
import path from 'node:path';

export const endpoint=(process.env.AURORA_PRESENCE_ENDPOINT||'https://aurora-edge.aurora-edge.workers.dev').replace(/\/$/,'');
export const appId=process.env.DISCORD_APPLICATION_ID||'1555389940542611596';
export const configDir=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'.aurora'),'Aurora');
export const configPath=path.join(configDir,'discord-companion.json');
export const companionRoot=path.resolve(import.meta.dirname,'..');
export const socialSdkExe=path.join(companionRoot,'native-social-sdk','target','release','aurora-discord-social-sdk.exe');
export const socialSdkDll=path.join(companionRoot,'vendor','discord_social_sdk','bin','release','discord_partner_sdk.dll');
