import { requestGoogleToken, type GoogleOAuth } from "./google-token";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleOAuth;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function prepareGoogleConnection(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = setTimeout(() => fail(), 15_000);
    function fail() {
      clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      script.remove();
      scriptPromise = null;
      reject(new Error("Não foi possível carregar a conexão do Google. Verifique sua conexão e tente novamente."));
    }
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      clearTimeout(timeout);
      if (window.google?.accounts?.oauth2) resolve();
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function googleConnectionReady() {
  return Boolean(CLIENT_ID);
}

export function connectGoogle(signal?: AbortSignal): Promise<string> {
  if (!CLIENT_ID) throw new Error("Falta configurar o identificador OAuth do Google.");
  if (!window.google?.accounts?.oauth2) throw new Error("A conexão com o Google ainda está carregando. Tente novamente em instantes.");
  return requestGoogleToken(window.google.accounts.oauth2, CLIENT_ID, signal);
}

export async function getYouTubeProfile(accessToken: string, signal?: AbortSignal) {
  const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(response.status === 401
    ? "Sua autorização expirou. Conecte sua conta novamente."
    : "Não foi possível ler seu perfil do YouTube. Confira a permissão de leitura e a API ativada no projeto.");
  const data = await response.json() as { items?: Array<{ snippet: { title: string; thumbnails?: { default?: { url: string } } } }> };
  const channel = data.items?.[0]?.snippet;
  if (!channel) throw new Error("Esta conta não retornou um perfil do YouTube. Tente conectar a conta usada no YouTube Music.");
  return { name: channel.title, avatar: channel.thumbnails?.default?.url };
}
