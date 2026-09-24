# Verificação Google e YouTube

O login básico do Aurora está em produção e usa apenas identidade Google. A opção **Conectar YouTube** solicita `youtube.readonly`, um escopo sensível que continua sujeito ao limite de usuários até ser aprovado.

## Material para submissão

- página inicial pública e funcional;
- domínio e origens OAuth revisados;
- política de privacidade e termos públicos;
- vídeo sem cortes mostrando login, consentimento, biblioteca somente leitura e desconexão;
- justificativa: listar playlists, itens e curtidas da conta para reprodução no player oficial incorporado;
- confirmação de que o Aurora não baixa mídia, não escreve na conta e não compartilha dados da API;
- conta de teste e instruções de revisão;
- domínio verificado no Search Console.

## Antes de enviar

1. Confirmar no painel de acesso a dados que apenas `openid`, `email`, `profile` e `youtube.readonly` são solicitados.
2. Atualizar capturas e textos para a versão publicada.
3. Gravar o fluxo completo usando a origem de produção.
4. Enviar na Central de verificação e responder às solicitações do Google.
