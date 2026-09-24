# Aurora para Android

## Decisão

O primeiro aplicativo Android do Aurora será uma Trusted Web Activity (TWA) baseada na PWA pública. Essa arquitetura usa o navegador seguro do aparelho, preserva a compatibilidade com o player incorporado do YouTube e evita autenticação Google em WebView, que não é permitida pelas políticas OAuth.

## O que já está pronto

- manifesto instalável com ícones comuns e maskable;
- service worker com shell offline;
- atalhos para Início e Busca;
- layout responsivo e controles de mídia;
- biblioteca sincronizada pela conta Google;
- origem HTTPS pública.

## Empacotamento planejado

1. Definir o domínio permanente do produto. Para TWA, `/.well-known/assetlinks.json` precisa existir na raiz da mesma origem do aplicativo. Um domínio próprio do Aurora evita depender da raiz compartilhada do GitHub Pages.
2. Registrar `com.pajeeh.aurora` como identificador Android.
3. Criar e guardar a chave de assinatura fora do repositório.
4. Gerar o projeto TWA com Bubblewrap e configurar `targetSdkVersion 36`, requisito para novos envios ao Google Play a partir de 31 de agosto de 2026.
5. Publicar o fingerprint SHA-256 da chave no Digital Asset Links.
6. Testar login, reprodução, Media Session, retorno do segundo plano, offline e Aurora Connect em Android real.
7. Gerar Android App Bundle assinado e preparar a listagem fechada de testes na Play Store.

## Próxima evolução nativa

Se o beta mostrar necessidade de recursos que a plataforma web não cobre, o invólucro poderá ganhar componentes nativos pequenos para notificações, atalhos e integração com Discord. O player e o login devem continuar no navegador seguro.
