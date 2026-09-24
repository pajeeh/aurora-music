# Implantação gratuita no Cloudflare

Este Worker reúne Aurora Connect e o card público em uma única URL. Cada sala e o card usam Durable Objects com armazenamento SQLite, disponíveis no plano gratuito.

1. Crie uma conta Cloudflare gratuita e autentique o Wrangler com `npx wrangler login`.
2. Em `cloudflare-worker`, execute `npm install`.
3. Salve `GOOGLE_CLIENT_ID` e `ALLOWED_EMAIL` como segredos com `npx wrangler secret put NOME`. Use o cliente OAuth do Aurora e o email autorizado; não coloque esses valores no arquivo de configuração.
4. Execute `npm run deploy` e copie a URL `https://aurora-edge.<subdominio>.workers.dev`.
5. Defina essa URL nas variables `VITE_CONNECT_ENDPOINT` e `VITE_NOW_PLAYING_ENDPOINT` do repositório `pajeeh/aurora-music`. O mesmo endpoint mantém as curtidas do Aurora sincronizadas entre navegadores conectados à mesma conta Google.
6. Adicione a origem do Pages às origens autorizadas do cliente OAuth Google, mantenha `AURORA_ORIGIN=https://pajeeh.github.io` e republique o Pages.
7. Valide `/health`, Connect entre dois navegadores, `/now-playing.svg`, `/api/library` com uma conta conectada e uma tentativa de publicação com outra conta.

O plano gratuito tem limites diários e as requisições passam a falhar quando eles são excedidos; não há cobrança automática por excedente no Free. Consulte o painel de uso. O polling atual do Connect faz cerca de 86.400 requisições/dia para um único dispositivo mantido conectado o dia inteiro, portanto encerre sessões quando terminar. Uma evolução futura deve trocar polling por WebSocket hibernável para suportar sessões continuamente abertas com maior folga.
