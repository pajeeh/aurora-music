# Aurora no Discord

## Objetivo

Exibir o Aurora como atividade pessoal no Discord, com faixa, artista, capa, progresso e ações para abrir o Aurora ou ouvir junto. A integração deve ser opcional e nunca enviar token Google, áudio ou biblioteca privada ao Discord.

## Limite da aplicação web

A PWA não pode publicar Rich Presence diretamente no cliente Discord. Um bot também não resolve a presença pessoal: ele exibe a atividade da conta do bot. O Aurora precisa de uma ponte nativa pequena no dispositivo do usuário.

## Caminho oficial escolhido

Usar o Discord Social SDK em um **Aurora Companion** para Windows e, depois, dentro do invólucro Android. O SDK oficial publica Rich Presence e aceita atividades do tipo `Listening`. No Android atual, o transporte RPC pode publicar presença no aplicativo Discord já autenticado sem exigir um novo OAuth apenas para a presença.

O card proposto no Discord terá:

- nome da atividade: `Aurora Music`;
- detalhes: título da faixa;
- estado: artista e, quando existir, álbum;
- imagem grande: capa HTTPS validada, com a marca Aurora como fallback;
- tempo decorrido e duração enquanto estiver tocando;
- botão **Abrir no Aurora**;
- botão **Ouvir junto** quando houver uma sessão Aurora Connect compartilhável.

A identidade exibida no Discord vem do modelo de artista do Aurora, e não diretamente do nome do canal que publicou o vídeo. A arquitetura compartilhada está em [Identidade musical, descoberta e presença](ARTIST_DISCOVERY_AND_PRESENCE.md).

## Arquitetura

```text
Aurora web/PWA
  └─ publica presença privada do usuário
       └─ Aurora Presence (Cloudflare, autenticado)
            └─ canal pareado e temporário
                 └─ Aurora Companion / app Android
                      └─ Discord Social SDK
                           └─ Rich Presence do usuário
```

O serviço de presença precisa ser multiusuário. O serviço `now-playing-service` atual continuará responsável pelo card público do perfil do Pajé; ele não deve ser reutilizado como armazenamento global porque foi desenhado para uma única identidade autorizada.

## Pareamento seguro

1. O usuário ativa **Mostrar no Discord** nas configurações do Aurora.
2. O Aurora gera um código curto, descartável e vinculado à conta atual.
3. O Companion usa esse código para receber um token próprio do dispositivo.
4. O token permite ler somente a presença daquele usuário, sem acesso à conta Google ou à biblioteca.
5. Revogar o dispositivo, sair da conta ou desativar a opção encerra o canal e limpa a presença.

O Companion deve guardar o token no cofre de credenciais do sistema, limitar a origem do pareamento, validar todos os campos recebidos e apagar o Rich Presence quando o estado expirar.

## Estado da implementação

Já estão implementados o serviço multiusuário, a publicação privada pelo player, os códigos descartáveis, a revogação por dispositivo, a expiração da faixa e o Companion para Windows em `platforms/discord-companion`.

O aplicativo **Aurora Music** foi criado no Discord Developer Portal com o Application ID público `1555389940542611596`, o asset `aurora`, ícone, descrição, termos e privacidade. O Companion já inclui esse identificador e usa o transporte IPC do Discord Desktop; não exige bot em servidor. O teste real confirmou faixa, artista, capa e tempo no perfil. O RPC público rotula a atividade como **Jogando Aurora Music**; o rótulo reservado **Ouvindo** depende de acesso privilegiado do Discord.

## Entregas

### Fase 1 — prova no Windows

- ✅ criar o aplicativo `Aurora Music` no Discord Developer Portal;
- ✅ cadastrar a identidade visual e o asset Rich Presence;
- ✅ construir um Companion mínimo;
- ✅ publicar faixa, artista e timestamps;
- ✅ adicionar ligar/desligar e limpar presença ao fechar;
- testar com Discord aberto, fechado, reconectando e com faixa pausada.

### Fase 2 — integração de produto

- ✅ criar presença privada multiusuário no Cloudflare Worker;
- ✅ parear e revogar dispositivos pela tela de configurações;
- ✅ mostrar estado `Discord conectado` no Aurora;
- integrar **Ouvir junto** a uma sessão Aurora Connect;
- distribuir o Companion assinado junto da versão Windows.

### Fase 3 — Android

- incorporar a biblioteca nativa do Social SDK ao projeto Android;
- publicar a mesma atividade pelo transporte RPC do Discord Android;
- respeitar bateria, segundo plano e preferências de privacidade;
- manter a PWA como interface e expor apenas uma ponte nativa restrita.

## Critérios para lançamento

- consentimento explícito e reversível;
- presença limpa em até alguns segundos ao pausar por muito tempo, sair ou fechar;
- nenhum segredo, token Google ou identificador interno no Rich Presence;
- limite de frequência e deduplicação de atualizações;
- capa remota restrita a HTTPS e fallback confiável;
- funcionamento sem instalar bot em servidor;
- logs sem tokens e com opção de diagnóstico local.

## Dependências externas

A implementação requer um Application ID criado no Discord Developer Portal e acesso ao pacote do Social SDK. Esses valores não devem ser inventados nem incluídos como segredo no repositório. O Application ID é público; credenciais OAuth e tokens de usuário não são.
