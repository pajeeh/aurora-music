# Aurora Discord Companion

Ponte local que lê somente a presença pareada do Aurora e publica uma atividade Rich Presence no Discord Desktop.

O Companion prefere o **Discord Social SDK oficial**, autentica a conta pelo fluxo oficial e envia a atividade como `Listening`. A primeira execução abre uma autorização do Discord; depois disso, as credenciais de curta duração são renovadas e guardadas pelo Windows DPAPI, sem novo código ou clique diário. Se o helper nativo ou a DLL não estiverem disponíveis, volta automaticamente ao RPC compatível, que mostra **Jogando Aurora Music**. O Discord ainda controla a apresentação final do rótulo em cada cliente.

## Preparação

1. Baixe o pacote principal do Social SDK pelo Discord Developer Portal.
2. Coloque `DiscordSocialSdk-1.10.19337.zip` em `Downloads` e execute `npm run sdk:install` nesta pasta. O checksum é validado antes da extração.
3. Execute `npm run sdk:build` para compilar o helper nativo em Rust.
4. Execute `npm install` nesta pasta.
5. Execute `npm run install:windows` para registrar a conexão por um clique.
6. No Aurora, abra **Discord · Tocando agora** e escolha **Conectar este PC**.
7. Execute `npm start` com o Discord Desktop aberto. O código manual continua disponível como recuperação.
8. Na primeira execução, confirme uma vez a autorização oficial **Aurora Music** aberta pelo Discord.

## Uso diário no Windows

- `npm run doctor` confere pareamento, nuvem, Social SDK e biblioteca nativa sem revelar credenciais.
- `npm run install:windows` cria um lançador local em `%LOCALAPPDATA%\Aurora\Discord Companion`.
- `npm run startup:install` ativa o Companion ao entrar no Windows.
- `npm run startup:remove` desativa a inicialização automática sem apagar o pareamento.

O diagnóstico termina com erro quando o Companion não conseguir funcionar e usa avisos quando puder continuar pelo RPC compatível. O log da inicialização automática fica somente no computador, em `%LOCALAPPDATA%\Aurora\Discord Companion\companion.log`, e é limitado automaticamente para não crescer sem controle.

O processo registra um heartbeat local usado pelo diagnóstico e o lançador reinicia o Companion após uma interrupção inesperada. Assim, uma falha temporária não exige reiniciar o Windows.

Se o vínculo for revogado, o Companion permanece aberto, marca o estado como **Precisa reconectar** e observa a configuração protegida. Ao clicar em **Corrigir conexão** no Aurora, o link `aurora://` entrega o novo código ao Companion e a sincronização volta sem reiniciar o computador ou copiar o código.

## Pacote para testers

`npm run pack:windows` monta um ZIP claramente identificado com Node.js, dependências, helper nativo, avisos de licença, instalação guiada, pareamento e diagnóstico. O pacote não contém token ou configuração pessoal. Depois de extrair, a pessoa executa apenas `INSTALAR-AURORA.cmd`; não precisa ter Node.js, Rust ou o repositório instalados. Um arquivo `.sha256` é criado ao lado para conferir a integridade do download.

O ZIP, as DLLs extraídas e os binários compilados ficam ignorados pelo Git. Para forçar o fallback durante diagnóstico, use `AURORA_DISCORD_TRANSPORT=rpc`.

O aplicativo oficial **Aurora Music** usa o Application ID público `1555389940542611596` e o asset Rich Presence `aurora`. `DISCORD_APPLICATION_ID` continua disponível apenas para desenvolvimento com outro aplicativo.

O token pareado e as credenciais do Discord ficam criptografados pelo Windows DPAPI para o usuário atual, fora do repositório, em `%LOCALAPPDATA%\Aurora\discord-companion.json`. Revogue o computador pela mesma tela do Aurora. Nenhum token Google ou YouTube chega ao Companion ou ao Discord, e nenhum token é escrito nos logs.
