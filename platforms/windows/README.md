# Aurora Music para Windows

O aplicativo desktop usa Tauri 2 e o WebView2 do Windows. A janela nativa abre o Aurora público, preservando o login Google e a reprodução oficial pelo YouTube. O shell adiciona ícone na bandeja, restauração por clique e minimização segura para segundo plano.

## Desenvolvimento

Pré-requisitos: Node.js 22, Rust com toolchain MSVC, Microsoft C++ Build Tools e WebView2.

```powershell
npm ci
npm run desktop:dev
```

## Instalador

```powershell
npm ci
npm run build
npm run desktop:build
```

O instalador NSIS fica em `src-tauri/target/release/bundle/nsis/` e instala apenas para o usuário atual, sem exigir privilégios de administrador.

## Comportamento

- fechar a janela mantém o Aurora disponível na bandeja;
- clicar no ícone da bandeja restaura e foca a janela;
- o menu oferece **Abrir Aurora** e **Sair do Aurora**;
- a aplicação continua usando o endereço oficial `https://pajeeh.github.io/aurora-music/` para manter autenticação e atualizações web compatíveis.
