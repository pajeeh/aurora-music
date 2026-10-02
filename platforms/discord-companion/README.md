# Aurora Discord Companion

Ponte local que lê somente a presença pareada do Aurora e publica uma atividade `Listening` no Discord Desktop.

## Preparação

1. Execute `npm install` nesta pasta.
2. No Aurora, abra o menu da conta, escolha **Discord · Tocando agora** e gere um código.
3. Execute `npm run pair -- 12345678` substituindo pelo código exibido.
4. Execute `npm start` com o Discord Desktop aberto.

O aplicativo oficial **Aurora Music** usa o Application ID público `1555389940542611596` e o asset Rich Presence `aurora`. `DISCORD_APPLICATION_ID` continua disponível apenas para desenvolvimento com outro aplicativo.

O token pareado fica criptografado pelo Windows DPAPI para o usuário atual, fora do repositório, em `%LOCALAPPDATA%\Aurora\discord-companion.json`. Revogue o computador pela mesma tela do Aurora. Nenhum token Google ou YouTube chega ao Companion ou ao Discord.
