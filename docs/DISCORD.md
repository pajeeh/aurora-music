# Aurora no Discord

Aplicações web não podem atualizar diretamente o Rich Presence do Discord. O navegador não recebe acesso ao cliente local do Discord, e um bot comum mostra a própria atividade, não a atividade pessoal do ouvinte.

O caminho planejado é um **Aurora Companion** opcional para Windows, macOS e Linux:

1. O app local conecta ao Discord RPC com um Application ID do Aurora.
2. O Aurora envia somente faixa, artista, estado e tempo de reprodução pelo canal local autenticado.
3. O usuário ativa ou desativa a presença nas configurações.
4. Nenhum token Google ou áudio sai do navegador.
5. Quando o companion estiver fechado, a presença é removida imediatamente.

Uma integração de bot poderá ser adicionada depois para servidores, comandos de compartilhamento e sessões coletivas. Ela será independente da presença pessoal.
