export function normalizePairCode(input=''){
  const value=String(input).trim();
  if(value.toLowerCase().startsWith('aurora://')){
    const url=new URL(value);
    if(url.hostname!=='discord-pair')throw new Error('Link de pareamento do Aurora inválido.');
    return (url.searchParams.get('code')||'').replace(/\s/g,'');
  }
  return value.replace(/\s/g,'');
}

export function validPairCode(input=''){try{return /^\d{8}$/.test(normalizePairCode(input));}catch{return false;}}

export function retryDelay(failures,{needsPairing=false}={}){
  if(needsPairing)return 30000;
  if(failures<=0)return 5000;
  return Math.min(60000,5000*(2**Math.min(failures,4)));
}
