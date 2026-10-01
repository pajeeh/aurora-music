# Lançamento multiplataforma

## Base compartilhada

Windows e Android usam a mesma PWA publicada. Interface, catálogo, autenticação, perfis, playlists, Aurora Connect, player e persistência continuam em uma única base. Os pacotes de loja são canais de instalação; não mantêm cópias divergentes da aplicação.

## Gate comum

```bash
npm ci
npm test
npm run build
npm run platform:check
```

Antes de cada beta, validar em aparelho real:

- instalação e primeira abertura;
- login Google básico e autorização opcional do YouTube;
- reprodução, pausa, avanço, fila, volume e controles de mídia;
- retorno depois de segundo plano ou suspensão;
- atualização para uma nova versão sem perda da biblioteca;
- abertura sem rede e recuperação após a conexão voltar;
- links de perfil, playlist e sessão compartilhada.

## Responsabilidades por plataforma

| Superfície | Windows | Android |
| --- | --- | --- |
| Pacote | MSIX/PWA | AAB/TWA |
| Renderização | Edge WebView/PWA hospedada | Navegador do aparelho via TWA |
| Distribuição | Microsoft Store | Google Play |
| Associação | Identidade do Partner Center | Digital Asset Links |
| Assinatura | Microsoft Store | Chave Android/Play App Signing |
| Atualização do produto | Origem web + service worker | Origem web + service worker |

Artefatos assinados, certificados, senhas e chaves ficam fora do Git. Apenas modelos, instruções e verificações públicas pertencem ao repositório.

## Builds de teste

O workflow **Construir aplicativos** pode ser iniciado manualmente no GitHub Actions. Ele gera um APK Android com assinatura de debug e valida a fonte PWA usada pelo Windows. Os artefatos expiram após 14 dias e não substituem os pacotes assinados das lojas.
