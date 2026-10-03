import {useEffect,useState} from 'react';
import {connectGoogle,googleConnectionReady,prepareGoogleConnection} from './google';

export function DesktopYouTubeLogin(){
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('Prepare a conexão segura com sua biblioteca do YouTube.');
  useEffect(()=>{if(!googleConnectionReady()){setMessage('Falta configurar a conexão do Google.');return;}prepareGoogleConnection().then(()=>setReady(true)).catch(error=>setMessage((error as Error).message));},[]);
  async function authorize(){
    const params=new URLSearchParams(location.search),port=params.get('port'),nonce=params.get('nonce');
    if(!port||!nonce)return setMessage('Este link de autorização não é válido. Volte ao aplicativo Aurora.');
    setBusy(true);
    try{
      const grant=await connectGoogle(undefined,true);
      const response=await fetch(`http://127.0.0.1:${port}/aurora-youtube`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce,...grant})});
      if(!response.ok)throw new Error('O aplicativo recusou a autorização.');
      setMessage('YouTube conectado. Você já pode fechar esta página e voltar ao Aurora.');
    }catch(error){setMessage((error as Error).message);setBusy(false);}
  }
  return <main className="fatal-error"><img src={`${import.meta.env.BASE_URL}aurora-icon.svg`} alt=""/><p className="eyebrow">AURORA PARA WINDOWS</p><h1>Conectar YouTube</h1><p>{message}</p><div><button className="primary-button" disabled={!ready||busy} onClick={()=>void authorize()}>{busy?'Aguardando autorização…':'Autorizar com Google'}</button></div></main>;
}
