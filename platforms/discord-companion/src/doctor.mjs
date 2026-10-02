import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {unprotectSecret} from './secrets.mjs';
import {configPath,endpoint,socialSdkDll,socialSdkExe} from './settings.mjs';

export function supportsNode(version=process.versions.node){return Number(version.split('.')[0])>=22;}
export function summarize(results){return results.some(item=>item.level==='error')?1:0;}

async function exists(file){try{await fs.access(file);return true;}catch{return false;}}
async function request(url,options={}){return fetch(url,{...options,signal:AbortSignal.timeout(5000)});}

export async function diagnose(){
  const results=[];const add=(level,label,detail)=>results.push({level,label,detail});
  process.platform==='win32'?add('ok','Windows','Compatível'):add('error','Sistema','O Companion requer Windows nesta versão.');
  supportsNode()?add('ok','Node.js',process.versions.node):add('error','Node.js',`Versão ${process.versions.node}; instale a 22 ou mais recente.`);
  (await exists(socialSdkExe))?add('ok','Social SDK','Helper nativo pronto'):add('warn','Social SDK','Helper ausente; o Aurora usará o modo RPC compatível.');
  (await exists(socialSdkDll))?add('ok','Biblioteca Discord','Encontrada'):add('warn','Biblioteca Discord','Ausente; execute npm run sdk:install e npm run sdk:build.');

  let token='';
  try{
    const config=JSON.parse(await fs.readFile(configPath,'utf8'));
    if(!config.protectedToken)throw new Error('token ausente');
    token=unprotectSecret(config.protectedToken);
    if(!token)throw new Error('token vazio');
    add('ok','Pareamento','Token protegido pelo Windows e legível pelo usuário atual');
  }catch(error){add('error','Pareamento',`Não configurado ou inválido (${error.message}). Execute npm run pair.`);}

  try{const response=await request(`${endpoint}/health`);response.ok?add('ok','Aurora Cloud','Serviço online'):add('error','Aurora Cloud',`Resposta HTTP ${response.status}`);}catch(error){add('error','Aurora Cloud',`Sem resposta (${error.message})`);}
  if(token){try{const response=await request(`${endpoint}/api/presence/device`,{headers:{Authorization:`Bearer ${token}`}});if(response.ok)add('ok','Sessão','Este computador está autorizado');else if(response.status===401)add('error','Sessão','Pareamento revogado; gere um código novo no Aurora.');else add('error','Sessão',`Resposta HTTP ${response.status}`);}catch(error){add('error','Sessão',`Não foi possível validar (${error.message})`);}}
  return results;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log('\nAurora Discord Companion · diagnóstico\n');
  const results=await diagnose();
  for(const item of results)console.log(`${item.level==='ok'?'✓':item.level==='warn'?'!':'✕'} ${item.label}: ${item.detail}`);
  const exitCode=summarize(results);console.log(exitCode?'\nHá itens que precisam de correção.':'\nTudo pronto para tocar.');process.exitCode=exitCode;
}
