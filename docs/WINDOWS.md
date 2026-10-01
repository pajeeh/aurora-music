# Aurora para Windows

## Arquitetura

O Aurora para Windows usa a PWA publicada como aplicativo instalado. Esse formato preserva a mesma base React, o login Google em contexto seguro de navegador, o player oficial do YouTube, a Media Session, o cache offline e as atualizações do site.

O pacote para a Microsoft Store será um MSIX gerado pelo PWABuilder. A Store assina e distribui o pacote, enquanto o conteúdo continua vindo da origem HTTPS do Aurora. Isso evita manter um segundo player e reduz o risco de diferenças entre web e desktop.

## Experiência já disponível

- instalação pelo Edge ou Chrome;
- janela independente, ícone no menu Iniciar e fixação na barra de tarefas;
- controles de mídia do Windows por Media Session;
- atalhos para Início, Busca e Comunidade;
- biblioteca local durante quedas de conexão;
- aviso e aplicação controlada de novas versões;
- interface responsiva para janelas compactas e telas grandes.

## Pacote da Microsoft Store

1. Reservar **Aurora Music** no Microsoft Partner Center.
2. Copiar os valores de identidade do produto: package ID, publisher ID e publisher display name.
3. Avaliar `https://pajeeh.github.io/aurora-music/` no PWABuilder.
4. Gerar o pacote Windows usando os valores do Partner Center.
5. Instalar o MSIX em uma máquina de teste e validar login, reprodução, atalhos, atualização, retomada e modo offline.
6. Enviar primeiro para uma audiência privada na Store; ampliar depois da homologação.

Esses valores pertencem à conta da Store e não devem ser inventados nem gravados no repositório. O comando `npm run platform:check` valida tudo que pode ser comprovado antes deles.

## Critérios de qualidade

- nenhuma credencial ou token dentro do pacote;
- nenhuma WebView própria para o login Google;
- navegação externa claramente aberta no navegador;
- reprodução controlável pelas teclas de mídia;
- atualização recuperável sem limpar a biblioteca;
- comportamento útil quando a rede cai.
