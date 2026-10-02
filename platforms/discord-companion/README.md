# Aurora Discord Companion

Ponte local que lê somente a presença pareada do Aurora e publica uma atividade `Listening` no Discord Desktop.

## Preparação

1. Crie o aplicativo **Aurora Music** no Discord Developer Portal e copie o Application ID.
2. Cadastre uma imagem Rich Presence chamada `aurora` com o ícone do projeto.
3. Execute `npm install` nesta pasta.
4. No Aurora, abra o menu da conta, escolha **Discord · Tocando agora** e gere um código.
5. Execute `npm run pair -- 12345678` substituindo pelo código exibido.
6. No PowerShell, defina `$env:DISCORD_APPLICATION_ID='seu-id-publico'` e execute `npm start`.

O token pareado fica criptografado pelo Windows DPAPI para o usuário atual, fora do repositório, em `%LOCALAPPDATA%\Aurora\discord-companion.json`. Revogue o computador pela mesma tela do Aurora. Nenhum token Google ou YouTube chega ao Companion ou ao Discord.
