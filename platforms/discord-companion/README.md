# Aurora Discord Companion

Ponte local que lê somente a presença pareada do Aurora e publica uma atividade Rich Presence no Discord Desktop.

O Companion prefere o **Discord Social SDK oficial** e envia a atividade como `Listening`. Se o helper nativo ou a DLL não estiverem disponíveis, volta automaticamente ao RPC compatível, que mostra **Jogando Aurora Music**. O Discord ainda controla a apresentação final do rótulo em cada cliente.

## Preparação

1. Baixe o pacote principal do Social SDK pelo Discord Developer Portal.
2. Coloque `DiscordSocialSdk-1.10.19337.zip` em `Downloads` e execute `npm run sdk:install` nesta pasta. O checksum é validado antes da extração.
3. Execute `npm run sdk:build` para compilar o helper nativo em Rust.
4. Execute `npm install` nesta pasta.
5. No Aurora, abra o menu da conta, escolha **Discord · Tocando agora** e gere um código.
6. Execute `npm run pair -- 12345678` substituindo pelo código exibido.
7. Execute `npm start` com o Discord Desktop aberto.

## Uso diário no Windows

- `npm run doctor` confere pareamento, nuvem, Social SDK e biblioteca nativa sem revelar credenciais.
- `npm run install:windows` cria um lançador local em `%LOCALAPPDATA%\Aurora\Discord Companion`.
- `npm run startup:install` ativa o Companion ao entrar no Windows.
- `npm run startup:remove` desativa a inicialização automática sem apagar o pareamento.

O diagnóstico termina com erro quando o Companion não conseguir funcionar e usa avisos quando puder continuar pelo RPC compatível. O log da inicialização automática fica somente no computador, em `%LOCALAPPDATA%\Aurora\Discord Companion\companion.log`, e é limitado automaticamente para não crescer sem controle.

O ZIP, as DLLs extraídas e os binários compilados ficam ignorados pelo Git. Para forçar o fallback durante diagnóstico, use `AURORA_DISCORD_TRANSPORT=rpc`.

O aplicativo oficial **Aurora Music** usa o Application ID público `1555389940542611596` e o asset Rich Presence `aurora`. `DISCORD_APPLICATION_ID` continua disponível apenas para desenvolvimento com outro aplicativo.

O token pareado fica criptografado pelo Windows DPAPI para o usuário atual, fora do repositório, em `%LOCALAPPDATA%\Aurora\discord-companion.json`. Revogue o computador pela mesma tela do Aurora. Nenhum token Google ou YouTube chega ao Companion ou ao Discord.
