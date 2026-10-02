# Candidatura ao Discord Social SDK

Este documento reúne as informações públicas e as respostas preparadas para solicitar acesso ao Discord Social SDK para o Aurora Music. Ele não contém segredos, tokens ou credenciais.

## Identificação

| Campo do portal | Resposta preparada |
| --- | --- |
| Company name | Aurora Music |
| Team location | São Paulo, Brazil |
| Full name | Luis Augusto Gomes dos Santos |
| Work email | Usar o e-mail de contato confirmado pelo responsável no momento do envio |
| Job title | Founder and Software Developer |
| Game website URL | https://pajeeh.github.io/aurora-music/ |
| Estimated DAU | Pre-launch / under 100 DAU |
| Publisher | No, the product is self-published |
| Platforms | Windows PC; iOS / Android |
| Marketing updates | Não aceitar, salvo escolha explícita do responsável |

O portal chama todo produto de “game”. O Aurora deve ser descrito com precisão como aplicativo musical social; não afirmar que é um jogo.

## Apresentação curta em inglês

> Aurora Music is a self-published social music player for web, Windows and Android. It uses the official YouTube embedded player and APIs for playback and read-only music discovery. Users can build local and collaborative playlists, follow profiles, share listening sessions through Aurora Connect and optionally display their current track on Discord. The Windows companion is already paired securely with the web app and publishes title, artist, artwork and elapsed time through Discord's local RPC. We want to migrate that proof of concept to the official Discord Social SDK and use the Listening activity type when supported.

## Justificativa técnica em inglês

> We are requesting Social SDK access to replace the community RPC package used by our Windows proof of concept with Discord's supported SDK. The integration is opt-in and reversible. Aurora sends only the activity selected by the user: track title, artist, album when available, HTTPS artwork, playback timestamps and optional public deep links. It never sends Google or YouTube tokens, email addresses, private library contents, audio or invitation secrets to Discord. Paired-device credentials are scoped to reading that user's presence, stored with Windows DPAPI and can be revoked from Aurora.

## Resposta caso perguntem sobre `Listening`

> Aurora is a music application, so Listening accurately represents the user's action. Discord Social SDK 1.5 release notes announce support for Listening activities and the current SDK enum includes `ActivityTypes::Listening`. We understand that Discord controls how activity types are rendered and will keep a Playing fallback if Listening is unavailable for this application or platform.

## Evidências públicas

- Aplicativo: https://pajeeh.github.io/aurora-music/
- Showcase: https://pajeeh.github.io/aurora-music/showcase.html
- Beta e roteiro de teste: https://pajeeh.github.io/aurora-music/beta.html
- Política de Privacidade: https://pajeeh.github.io/aurora-music/privacy.html
- Termos de Uso: https://pajeeh.github.io/aurora-music/terms.html
- Código-fonte: https://github.com/pajeeh/aurora-music
- Discord Application ID público: `1555389940542611596`
- Asset de Rich Presence: `aurora`

## Fluxo e minimização de dados

```text
Aurora Web/PWA
  -> presença privada autenticada no Cloudflare Worker
  -> token de dispositivo limitado, revogável e armazenado com DPAPI
  -> Aurora Companion no Windows
  -> Discord Social SDK local
  -> atividade do próprio usuário no Discord
```

Dados enviados ao Discord quando a opção estiver ativa:

- nome público da atividade (`Aurora Music`);
- título, artista e álbum da faixa;
- URL HTTPS da capa ou asset Aurora como fallback;
- início e duração para mostrar o progresso;
- links públicos para abrir o Aurora e, futuramente, ouvir junto.

Dados que nunca são enviados ao Discord:

- token, identificador ou e-mail Google;
- token de autorização do YouTube;
- biblioteca, curtidas ou histórico completos;
- áudio ou vídeo;
- código ou token privado do Aurora Connect;
- token interno de pareamento do Companion.

## Demonstração para revisão

1. Abrir o Aurora e entrar com uma conta Google.
2. Em **Configurações > Discord**, ativar a presença e gerar um código descartável.
3. Parear o Companion no Windows.
4. Reproduzir uma faixa e abrir o perfil do Discord.
5. Confirmar título, artista, capa e tempo decorrido.
6. Pausar ou desativar a integração e confirmar que a atividade é removida.
7. Revogar o dispositivo no Aurora e confirmar que o token deixa de funcionar.

## Gate de migração

- baixar o SDK somente pelo Developer Portal;
- aceitar e registrar a versão dos termos aplicáveis;
- manter o RPC atual como fallback temporário durante a migração;
- implementar `ActivityTypes::Listening` no Companion oficial;
- não incluir chaves privadas no cliente ou no repositório;
- testar conexão, reconexão, pausa, expiração, revogação e encerramento;
- validar Windows antes de ampliar para Android;
- atualizar os avisos de privacidade e os binários assinados antes da distribuição.

## Fontes oficiais

- Social SDK: https://discord.com/developers/docs/social-sdk/index.html
- Getting started: https://discord.com/developers/docs/social-sdk/getting_started.html
- Activity types: https://discord.com/developers/docs/social-sdk/namespacediscordpp.html
- Release notes: https://discord.com/developers/docs/social-sdk/release_notes.html

## Estado da candidatura

- [x] Aplicativo Discord criado e identificado
- [x] Site, termos e privacidade públicos
- [x] Prova funcional no Windows com RPC local
- [x] Pareamento, revogação e armazenamento protegido implementados
- [x] Respostas e justificativa preparadas
- [x] E-mail de trabalho confirmado pelo responsável
- [x] Formulário do Social SDK enviado em 1 de outubro de 2026
- [x] Acesso instantâneo concedido pelo Discord
- [x] SDK principal baixado pelo Developer Portal
- [x] Migrar o Companion para o SDK oficial
- [x] Validar a renderização de `Listening`: o Discord ainda exibe `Jogando`

## SDK liberado

- Versão: `1.10.19337`
- Data informada pelo portal: 1 de setembro de 2026
- Pacote: `DiscordSocialSdk-1.10.19337.zip`
- Tamanho: 781.103.142 bytes
- SHA-256: `D784097504685953849CC2842561D8A8013326FE0B8DF65A1DE63DDEFDE62045`
- Arquivo local: `%USERPROFILE%\Downloads\DiscordSocialSdk-1.10.19337.zip`

O pacote do SDK não deve ser versionado ou redistribuído pelo repositório. O código do Aurora deve referenciá-lo por um caminho local configurável e respeitar os termos aceitos no Developer Portal.

## Resultado da validação

O Companion compilado com o Social SDK `1.10.19337` iniciou, conectou e publicou a faixa real usando `ActivityTypes::Listening`. O perfil mostrou corretamente aplicativo, título, artista, capa e tempo, porém manteve o cabeçalho **Jogando**. Portanto, o tipo existe na API, mas não concede ao Aurora o tratamento visual reservado ao Spotify. A implementação conserva o SDK oficial por suporte e evolução futura, sem apresentar esse rótulo como funcionalidade disponível.
