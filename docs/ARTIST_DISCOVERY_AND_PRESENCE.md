# Identidade musical, descoberta e presença

Este documento consolida três sistemas que precisam compartilhar a mesma linguagem: artistas no Aurora, canais usados para reprodução no YouTube e presença externa no Discord ou em outras redes.

## Princípio central

```text
Artista Aurora ≠ canal do YouTube ≠ atividade externa
```

- **Artista Aurora** representa a identidade musical seguida pelo usuário.
- **Canal do YouTube** representa a origem concreta de um vídeo e o destino de uma eventual inscrição.
- **Atividade externa** representa a faixa que o usuário decidiu mostrar no Discord ou em seu perfil musical vivo.

Um artista pode ter canal oficial, canal `Topic`, gravadora, distribuidora e vídeos publicados por terceiros. O Aurora não deve escolher silenciosamente em qual deles o usuário será inscrito.

## Modelo de dados

### Artist

```ts
type Artist = {
  id: string;
  name: string;
  image?: string;
  genres: string[];
  channelLinks: ArtistChannelLink[];
};
```

### ArtistChannelLink

```ts
type ArtistChannelLink = {
  channelId: string;
  title: string;
  url: string;
  kind: 'official' | 'topic' | 'label' | 'publisher' | 'unknown';
  confidence: 'verified' | 'curated' | 'inferred';
};
```

### UserArtistAffinity

```ts
type UserArtistAffinity = {
  artistId: string;
  following: boolean;
  score: number;
  hidden: boolean;
  signals: {
    likedTracks: number;
    playlistAdds: number;
    completedPlays: number;
    repeatPlays: number;
    searches: number;
    quickSkips: number;
  };
};
```

### Presence

```ts
type Presence = {
  userHandle: string;
  trackId: string;
  title: string;
  artistId?: string;
  artistName: string;
  sourceChannelId?: string;
  artwork?: string;
  playing: boolean;
  startedAt?: string;
  durationSeconds?: number;
  connectSession?: string;
  expiresAt: string;
};
```

A presença externa recebe nomes e imagens públicos. IDs internos, tokens Google e dados privados nunca entram no payload enviado ao Discord ou às redes.

## Descoberta de artistas

### Sinais iniciais

| Sinal | Peso inicial |
| --- | ---: |
| seguir artista no Aurora | +8 |
| curtir uma faixa | +6 |
| adicionar a playlist | +5 |
| ouvir até o fim | +3 |
| repetir faixa | +3 |
| buscar pelo artista | +2 |
| pular rapidamente | -3 |
| não recomendar | bloqueio |

Os pesos devem ser configuráveis e avaliados com métricas agregadas. O usuário sempre poderá ver uma justificativa simples, como **Porque você curtiu Flicts**.

### Composição da prateleira

- 60% de artistas próximos aos gostos confirmados;
- 25% de artistas relacionados por playlists e comportamento agregado;
- 15% de exploração para evitar uma bolha repetitiva;
- limite por artista, canal e gênero na mesma prateleira;
- exclusão imediata de artistas ocultados.

Chamadas `search.list` do YouTube são caras e não devem acontecer a cada renderização. Resultados e resolução de canais serão guardados no servidor com expiração, enquanto o ranking pessoal usa os sinais já sincronizados do Aurora.

## Seguir no Aurora e inscrever-se no YouTube

### Seguir no Aurora

- altera recomendações e Radar;
- não exige permissão de escrita do Google;
- não cria inscrição externa;
- pode ser desfeito instantaneamente.

### Inscrever-se no YouTube

- aparece como ação separada;
- mostra nome, imagem, URL, tipo e confiança do canal;
- exige confirmação do usuário;
- solicita o escopo de gerenciamento somente nesse momento;
- usa o `channelId` confirmado em `subscriptions.insert`;
- nunca escolhe automaticamente um canal `Topic`, gravadora ou reupload.

Enquanto a verificação OAuth de escrita não estiver aprovada, o Aurora abre o canal correto no YouTube e permite que o usuário se inscreva por lá.

## Presença no Discord

O Discord consome a mesma `Presence` pública e temporária usada pelo Aurora Live Profile. O Companion não interpreta novamente o título do vídeo nem tenta descobrir o artista; ele recebe a identidade já resolvida pelo Aurora.

```text
Player
  ├─ registra sinais de afinidade
  ├─ resolve Artist + canal de origem
  └─ publica Presence temporária
       ├─ Aurora Live Profile
       ├─ cards sociais
       └─ Aurora Companion → Discord Rich Presence
```

O card do Discord mostrará:

- `Listening to Aurora Music`;
- faixa e artista Aurora;
- capa validada;
- progresso da reprodução;
- **Abrir no Aurora**;
- **Ouvir junto** quando existir uma sessão Aurora Connect compartilhável.

Seguir um artista ou inscrever-se em um canal nunca será consequência de clicar no card do Discord.

## Experiência móvel

A Home exibirá uma prateleira horizontal **Artistas para o seu momento**, com pouco mais de dois cards visíveis para indicar rolagem. Cada card terá foto, nome, motivo e **Seguir**.

Ao abrir o artista, uma folha inferior mostrará:

- tocar rádio do artista;
- seguir ou deixar de seguir no Aurora;
- músicas populares disponíveis;
- canais associados e nível de confiança;
- abrir ou inscrever-se no YouTube;
- compartilhar artista;
- não recomendar.

A escolha do canal nunca ficará escondida em um menu genérico.

## Entregas

### 1. Fundação

- persistir artista e canal de origem nas faixas encontradas;
- criar catálogo Aurora de artistas e vínculos de canal;
- registrar sinais de afinidade com limites de retenção;
- implementar seguir, deixar de seguir e não recomendar.

### 2. Descoberta

- prateleira móvel de artistas;
- justificativas de recomendação;
- página e rádio do artista;
- diversidade e redução de repetição;
- cache de candidatos no backend.

### 3. Canais e YouTube

- seletor transparente de canal;
- abertura segura do canal no YouTube;
- leitura das inscrições existentes;
- escrita incremental somente após aprovação OAuth.

### 4. Presença

- Presence API multiusuário;
- Aurora Live Profile;
- Companion Windows e ponte Android;
- Discord Rich Presence;
- cards e compartilhamento para outras redes.

## Critérios de qualidade

- nenhuma inscrição sem confirmação explícita;
- recomendação explica ao menos um motivo real;
- usuário pode esconder artista e limpar sinais;
- canal de origem do vídeo continua auditável;
- presença expira quando o player para de enviar batimentos;
- integrações externas respeitam preferências por faixa e sessão;
- algoritmo não usa e-mail, token Google ou identificadores secretos.
