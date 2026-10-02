import {spawnSync} from 'node:child_process';

function powershell(script,input){const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{input,encoding:'utf8',windowsHide:true});if(result.status!==0)throw new Error(`O Windows não conseguiu acessar o cofre local do Aurora. ${result.stderr.trim()}`.trim());return result.stdout.trim();}
const load="[Reflection.Assembly]::LoadWithPartialName('System.Security')|Out-Null;";
export function protectSecret(value){return powershell(load+"$v=[Console]::In.ReadToEnd();$b=[Text.Encoding]::UTF8.GetBytes($v);$p=[Security.Cryptography.ProtectedData]::Protect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Convert]::ToBase64String($p)",value);}
export function unprotectSecret(value){return powershell(load+"$v=[Console]::In.ReadToEnd();$b=[Convert]::FromBase64String($v);$p=[Security.Cryptography.ProtectedData]::Unprotect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Text.Encoding]::UTF8.GetString($p)",value);}
