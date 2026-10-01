# Aurora em redes sociais

## Objetivo

Permitir que uma pessoa mostre o que está ouvindo no Aurora em qualquer rede, preservando controle, privacidade e uma apresentação visual consistente. A integração deve usar APIs oficiais e nunca automatizar contas pessoais por scraping ou simulação de cliques.

## O que cada plataforma permite

| Plataforma | Presença automática no perfil | Integração viável |
| --- | --- | --- |
| Discord | Sim, por Rich Presence | Aurora Companion e Discord Social SDK |
| Instagram | Não há presença musical em tempo real para perfis pessoais | card para Stories; publicação pela API somente em contas profissionais elegíveis |
| WhatsApp | Não há API oficial para atualizar Status pessoal | compartilhar card, vídeo curto ou link pelo fluxo nativo do usuário |
| Facebook | Aplicativos não publicam livremente no perfil pessoal | diálogo de compartilhamento; publicação em Página elegível com autorização |
| Outras redes | Varia | Web Share, link vivo e cards nos formatos da plataforma |

A API do Instagram é voltada a contas profissionais e publicação de mídia. A WhatsApp Business Platform trata conversas empresariais, não o Status do usuário. No Facebook, o caminho seguro para perfis pessoais é o compartilhamento iniciado pela pessoa.

## Produto central: Aurora Live Profile

Cada usuário poderá ter uma página pública opcional:

```text
https://aurora.example/@usuario
```

A página mostrará em tempo real:

- faixa, artista, álbum e capa;
- tocando, pausado ou última faixa;
- progresso aproximado;
- playlists públicas e perfil Aurora;
- botões **Abrir no Aurora**, **Ouvir esta faixa** e **Ouvir junto**;
- tema ou skin escolhida pelo usuário.

Esse será o link estável para colocar nas bios do Instagram, Facebook, TikTok, X, Threads e outras redes. Quando alguém abrir, o conteúdo será atual. A imagem de prévia de um link não deve ser anunciada como tempo real, pois as redes guardam previews em cache.

## Aurora Presence API

Criar no Cloudflare Worker uma presença multiusuário separada do card pessoal atual:

- `PUT /api/presence/me`: publica o estado autenticado;
- `DELETE /api/presence/me`: encerra a presença;
- `GET /api/presence/@handle`: retorna somente os campos públicos;
- `GET /api/presence/@handle/events`: envia mudanças por SSE;
- `GET /share/@handle`: entrega HTML renderizado no servidor com Open Graph;
- `GET /card/@handle.jpg`: gera a imagem social atual;
- `GET /story/@handle`: gera card vertical ou vídeo curto para Stories e Status.

A resposta pública deve expirar rapidamente quando o player deixa de enviar batimentos. A escolha entre mostrar faixa ao vivo, última faixa ou nada pertence ao usuário.

## Experiência de compartilhamento

A tela **Compartilhar meu som** terá quatro ações:

1. **Copiar perfil ao vivo** — link permanente para a bio.
2. **Compartilhar agora** — usa o compartilhamento nativo do celular ou desktop.
3. **Criar Story/Status** — exporta um card 9:16 com capa, faixa, QR code e identidade Aurora.
4. **Criar publicação** — exporta card 1:1 ou 4:5 com legenda pronta.

No Android, o Share Sheet envia a imagem e o link diretamente para Instagram, WhatsApp, Facebook e outros apps instalados. A confirmação final continua com o usuário.

## Automação responsável

Não publicar a cada música. Isso gera spam, exige permissões maiores e pode violar limites das plataformas. As automações úteis são:

- resumo diário ou semanal, sempre opt-in;
- destaque quando o usuário tocar explicitamente em **Compartilhar**;
- atualização de um site ou widget controlado pelo Aurora;
- publicação em Página profissional, canal ou bot quando a API permitir;
- webhook pessoal para integrações avançadas.

## Privacidade e segurança

- recurso desligado por padrão;
- opção para ocultar músicas ou sessões específicas;
- expiração da presença após poucos minutos sem batimento;
- identificador público baseado no `@handle`, nunca no ID Google;
- tokens das redes guardados apenas no servidor e criptografados;
- revogação individual por plataforma;
- capas e metadados tratados como conteúdo não confiável;
- limite de frequência, tamanho e histórico;
- nenhum token em URL, card, QR code ou log.

## Ordem de implementação

### Fase 1 — alcance universal

- Presence API multiusuário;
- página pública viva por `@handle`;
- Open Graph e card 1:1/4:5;
- card vertical 9:16;
- Web Share e links específicos para WhatsApp e Facebook;
- controles de privacidade no perfil Aurora.

### Fase 2 — conteúdo social

- skins dos cards;
- QR code e links de atribuição;
- resumo semanal compartilhável;
- botão **Ouvir junto** com Aurora Connect;
- métricas agregadas de abertura, sem rastreamento invasivo.

### Fase 3 — APIs profissionais

- Instagram Professional Content Publishing, após revisão e permissões;
- publicação autorizada em Páginas do Facebook;
- bot de Discord e webhooks pessoais;
- conectores adicionais conforme demanda real dos usuários.

## Critério de sucesso

O Aurora não precisa fingir que controla perfis que as plataformas não permitem controlar. Ele precisa oferecer uma presença própria, bonita e viva, que possa ser aberta e compartilhada em qualquer lugar, somada a integrações oficiais onde elas realmente existem.
