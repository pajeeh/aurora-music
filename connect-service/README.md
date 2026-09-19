# Aurora Connect

Conecta navegadores por convite. O anfitrião controla a reprodução; participantes adicionam faixas. Só dispositivos que habilitaram reprodução podem ser escolhidos. Não implementa Chromecast, AirPlay ou descoberta de equipamentos.

## Local

Execute `npm start --prefix connect-service` junto com `npm run dev`. Abra `http://localhost:5173/aurora-music/`. O serviço escuta somente no computador local por padrão.

## Hospedagem HTTPS

Use o Dockerfile desta pasta em um serviço Node/Docker com **uma única instância** e volume persistente. Configure `HOST=0.0.0.0`, `PORT` conforme a hospedagem, `AURORA_ORIGIN=https://pajeeh.github.io` e `CONNECT_STATE_FILE=/data/sessions.json`. O volume `/data` precisa permitir escrita ao usuário `node` (UID 1000). Sem `CONNECT_STATE_FILE`, sessões ficam apenas em memória. Não use disco temporário de Cloud Run como armazenamento persistente.

O arquivo contém tokens de pareamento e não deve ser público, versionado nem servido por HTTP. A gravação usa substituição atômica e permissões restritas. Não compartilhe o mesmo arquivo entre processos. Um estado inválido impede a inicialização em vez de apagar sessões silenciosamente. Depois de reiniciar, a fila é recuperada e a reprodução permanece pausada até um comando do anfitrião.

Configure a variável `VITE_CONNECT_ENDPOINT` no GitHub de `pajeeh/aurora-music` com a URL HTTPS real do serviço e republique o app. Vazia, essa variável mantém o proxy local. A política de conexão do build inclui a origem configurada. O serviço permite chamadas do navegador somente da origem autorizada.

Verifique `/api/connect/health`, crie uma sessão, entre por convite em outro navegador, habilite reprodução e selecione o dispositivo. Verifique fila, pausa, seek, desconexão e reinício. Convites concedem acesso: compartilhe só com seus convidados. Sessões expiram após 12 horas sem atividade; limites atuais são 100 sessões, 20 dispositivos e 200 faixas por sessão. O limite de requisições é por endereço da conexão, portanto ajuste a arquitetura do proxy antes de escalar para muitos usuários.

OAuth e autoplay exigem validação nos navegadores reais e podem precisar de interação do usuário. Testes de API não substituem essa homologação.
