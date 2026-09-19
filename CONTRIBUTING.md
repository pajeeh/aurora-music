# Organização de branches

`main` é a versão estável publicada no GitHub Pages. Cada push nessa branch executa os testes, o build e a publicação.

Prepare mudanças em branches curtas: `feat/<assunto>` para funcionalidades e apresentação, `fix/<assunto>` para correções e `docs/<assunto>` para documentação. Abra uma pull request para revisar o diff antes de integrar à `main`. Não é necessário manter uma branch `develop` enquanto houver uma única linha de publicação.

Antes de integrar, rode `npm test`, `npm test --prefix connect-service`, `npm test --prefix now-playing-service` e `npm run build`. Para mudanças visuais, confira desktop e celular. Login e reprodução reais exigem uma conta Google autorizada.

Exclua uma branch concluída somente depois de confirmar que seu trabalho foi integrado e que ela não contém alterações exclusivas. Nunca descarte mudanças locais para trocar de branch.

## Showcase

O showcase está em `public/showcase.html` e `public/showcase.css`. Usa os SVGs aprovados de `public/icons/` e não depende de login. Mantenha as funções disponíveis e em teste descritas de acordo com o estado real do app. A arte punk original permanece em `public/aurora-pirate-banner.png`.
