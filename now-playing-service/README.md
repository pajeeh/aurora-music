# Aurora no perfil do GitHub

O Aurora envia título, artista e estado ao serviço HTTPS autenticando com o token Google já usado pelo app. Somente o email autorizado e o cliente OAuth configurado podem publicar. O token é validado no Google; não é armazenado no Firestore nem incorporado ao SVG. A faixa publicada é pública.

Enquanto uma faixa toca, o app renova o estado a cada minuto. Depois de três minutos sem atualização, o card passa a mostrar “Última faixa”. Pausar atualiza esse estado imediatamente quando a conexão está disponível. Sem dados, o card mostra “Nada tocando agora”. O GitHub usa um proxy de imagens: a renovação visual não é garantida a cada segundo.

## Implantação no Google Cloud

Requer projeto com faturamento habilitado, banco Firestore `(default)` e Cloud Run. O serviço usa credenciais gerenciadas do Google Cloud. A conta de serviço de execução precisa de acesso ao Firestore (`roles/datastore.user`); não publique chaves JSON no repositório.

Configure as variáveis de ambiente do serviço:

- `GOOGLE_CLIENT_ID`: o mesmo cliente OAuth do Aurora;
- `ALLOWED_EMAIL`: email Google do dono do card;
- `AURORA_ORIGIN`: `https://pajeeh.github.io` (ou `http://localhost:5173` para validar localmente);
- `PORT`: definido automaticamente pelo Cloud Run.

Com o projeto e a conta de serviço escolhidos, implante esta pasta pelo Cloud Run com build a partir do código-fonte. O endpoint de leitura do SVG deve ser público; o POST continua exigindo autenticação Google do dono. Limite o número máximo de instâncias e acompanhe o faturamento conforme o orçamento do projeto.

## Conectar o app e o perfil

1. Configure `VITE_NOW_PLAYING_ENDPOINT` nas variables do repositório `pajeeh/aurora-music` com a URL HTTPS real do serviço, sem `/api/now-playing`. A workflow do Pages já usa essa variável. Para desenvolvimento, use `.env.local`.
2. Refaça o build/publicação do app. A configuração do Vite inclui a origem do serviço na política de conexão do navegador.
3. Entre no Aurora com a conta autorizada, reproduza uma faixa e abra `<URL_DO_SERVICO>/now-playing.svg`. Confirme título, artista, pausa e mudança de faixa. Verifique que outra conta não consegue publicar.
4. No README de `pajeeh/pajeeh`, substitua apenas o `src` do card demonstrativo pela URL real `<URL_DO_SERVICO>/now-playing.svg` e remova o aviso de integração demonstrativa somente após a validação.

Não coloque tokens, emails ou credenciais na URL pública da imagem. Preserve o restante do README do perfil. Enquanto o serviço não estiver hospedado e validado, o card atual do perfil deve continuar identificado como demonstrativo.

## Verificação

`npm test --prefix now-playing-service` verifica o payload, escape de XML, textos longos e expiração do estado. `npm run build` verifica a integração no app. A validação completa requer Firestore, endpoint público e uma conta Google autorizada.
