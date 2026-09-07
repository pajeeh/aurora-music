export const YOUTUBE_READ_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

type TokenResponse = { access_token?: string; scope?: string; error?: string };
export type GoogleOAuth = {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    include_granted_scopes: boolean;
    callback(response: TokenResponse): void;
    error_callback(error: { type?: string }): void;
  }): { requestAccessToken(options: { prompt: string }): void };
};

// Called directly from the click handler, with Google's script already loaded.
export function requestGoogleToken(oauth: GoogleOAuth, clientId: string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, token?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      if (error) reject(error);
      else resolve(token!);
    };
    const cancel = () => finish(new Error("Tentativa cancelada. Feche a janela do Google antes de tentar novamente."));
    const timer = setTimeout(() => finish(new Error("A autorização não foi concluída. Feche a janela do Google e tente novamente.")), 120_000);
    if (signal?.aborted) { cancel(); return; }
    signal?.addEventListener("abort", cancel, { once: true });
    try {
      const client = oauth.initTokenClient({
        client_id: clientId,
        scope: YOUTUBE_READ_SCOPE,
        include_granted_scopes: false,
        callback(response) {
          if (response.error || !response.access_token) {
            finish(new Error(response.error === "access_denied"
              ? "O Google negou o acesso. Confira se a conta está na lista de testadores do Aurora e se a permissão de leitura foi autorizada."
              : "A conexão com o Google não foi concluída. Tente novamente."));
          } else if (!response.scope?.split(/\s+/).includes(YOUTUBE_READ_SCOPE)) {
            finish(new Error("A permissão de leitura do YouTube não foi autorizada. Conecte novamente para revisar as permissões."));
          } else finish(undefined, response.access_token);
        },
        error_callback(error) {
          finish(new Error(error.type === "popup_closed"
            ? "A janela do Google foi fechada. Você pode tentar novamente."
            : error.type === "popup_failed_to_open"
              ? "Não foi possível abrir a janela do Google. Permita pop-ups para o Aurora e tente novamente."
              : "Não foi possível concluir a autorização do Google. Tente novamente."));
        }
      });
      client.requestAccessToken({ prompt: "select_account" });
    } catch {
      finish(new Error("Não foi possível iniciar a autorização do Google. Tente novamente."));
    }
  });
}
