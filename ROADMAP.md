# Roadmap do Aurora

Este roadmap orienta o crescimento do Aurora depois da beta social. A ordem prioriza retenção, identidade própria, segurança para receber usuários e recursos que geram compartilhamento orgânico.

## Próximo ciclo

- onboarding por gostos musicais, com artistas e gêneros favoritos;
- [x] perfil público ou privado, com aprovação de seguidores;
- [x] exclusão da conta e dos dados sociais dentro do app;
- denúncia, bloqueio e limites contra spam;
- capas, descrições e níveis de permissão em playlists colaborativas;
- feed mostrando amigos ouvindo em tempo real;
- métricas anônimas de ativação, retenção e falhas;
- fluxo de feedback dentro do Aurora.

## Aurora Match

Recurso de destaque para comparar duas identidades musicais e criar uma experiência compartilhável.

### Primeira versão — em desenvolvimento

- [x] comparar uma seleção voluntária de curtidas e histórico recente;
- [x] calcular uma porcentagem de compatibilidade explicável;
- [x] mostrar faixas e artistas em comum;
- [x] destacar descobertas que apenas uma pessoa conhece;
- [x] gerar uma playlist conjunta que ambos podem editar;
- [x] produzir um card compartilhável sem expor dados privados.

### Critérios de qualidade

- o resultado deve explicar os fatores da pontuação;
- o usuário escolhe quais dados entram na comparação;
- perfis privados exigem convite aceito;
- a comparação não usa e-mail, identificador Google ou token;
- bloquear uma pessoa encerra comparações e convites ativos.

## Descoberta musical

- rádio baseada em faixa, artista ou playlist;
- mixes diários atualizados pelo comportamento do usuário;
- recomendações com justificativas simples;
- páginas de artistas, gêneros e lançamentos;
- controles para reduzir repetição e esconder recomendações.

## Comunidade

- reações e comentários em playlists;
- retrospectiva semanal e cards compartilháveis;
- atividade ao vivo opcional;
- seguidores, listas de seguindo e descoberta por amigos;
- notificações para convites, colaboração e novos seguidores.

## Player e dispositivos

- fila inteligente e recuperação automática de vídeos indisponíveis;
- letras com tradução quando houver fonte autorizada;
- continuidade entre celular e computador;
- controles remotos pelo Aurora Connect;
- avaliação técnica de crossfade dentro das limitações do player oficial.

## Aplicativos e integrações

- Android via PWA e Trusted Web Activity;
- Aurora Companion para Discord Rich Presence;
- extensão para navegador e VS Code;
- links universais para músicas, perfis e playlists;
- preparação futura para Windows, macOS e Linux.

## Plataforma e confiança

- backup e recuperação dos dados sociais;
- auditoria de permissões, abuso e privacidade;
- observabilidade de erros sem registrar tokens ou conteúdo privado;
- verificação do escopo `youtube.readonly` pelo Google;
- documentação para testers, contribuidores e possíveis patrocinadores.
