import {useEffect,useRef,useState} from 'react';
import {googleConnectionReady,prepareGoogleConnection} from './google';

declare global { interface Window { __TAURI_INTERNALS__?: unknown } }

type Props={onCredential:(credential:string)=>void;notify:(message:string)=>void};

export function GoogleSignInButton({onCredential,notify}:Props){
  const host=useRef<HTMLDivElement>(null),callback=useRef(onCredential),report=useRef(notify);
  const [desktopBusy,setDesktopBusy]=useState(false);
  const desktop=Boolean(window.__TAURI_INTERNALS__);
  callback.current=onCredential;report.current=notify;

  useEffect(()=>{
    const receive=(event:Event)=>{setDesktopBusy(false);callback.current((event as CustomEvent<string>).detail);};
    window.addEventListener('aurora-google-credential',receive);
    return()=>window.removeEventListener('aurora-google-credential',receive);
  },[]);

  useEffect(()=>{
    if(desktop)return;
    let active=true;
    (async()=>{try{
      const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID as string|undefined;
      if(!googleConnectionReady()||!clientId)throw new Error('Falta configurar o login do Google.');
      await prepareGoogleConnection();
      if(!active||!host.current||!window.google?.accounts.id)return;
      window.google.accounts.id.initialize({client_id:clientId,callback:async value=>{
        const params=new URLSearchParams(location.search),port=params.get('port'),nonce=params.get('nonce');
        if(params.get('desktop-login')==='1'&&port&&nonce){
          try{
            const response=await fetch(`http://127.0.0.1:${port}/aurora-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce,credential:value.credential})});
            if(!response.ok)throw new Error();
            report.current('Login concluído. Volte ao aplicativo Aurora.');
          }catch{report.current('O Aurora não recebeu o login. Mantenha o aplicativo aberto e tente novamente.');}
        }else callback.current(value.credential);
      },ux_mode:'popup'});
      window.google.accounts.id.renderButton(host.current,{theme:'filled_black',shape:'pill',size:'large',text:'continue_with',locale:'pt-BR'});
    }catch(error){if(active)report.current((error as Error).message);}})();
    return()=>{active=false;};
  },[desktop]);

  async function startDesktopLogin(){
    setDesktopBusy(true);
    try{
      const {invoke}=await import('@tauri-apps/api/core');
      await invoke('start_google_login');
      report.current('Conclua o login no navegador que foi aberto.');
    }catch(error){report.current(String(error));setDesktopBusy(false);}
  }

  return desktop
    ?<button className="google-desktop-login" disabled={desktopBusy} onClick={startDesktopLogin}>{desktopBusy?'Aguardando Google…':'Entrar com Google'}</button>
    :<div className="google-signin" ref={host}/>;
}
