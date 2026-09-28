# Segurança

Não abra uma issue pública para vulnerabilidades, tokens expostos ou dados pessoais. Envie um relato privado pela área **Security → Report a vulnerability** deste repositório.

Inclua a área afetada, impacto, passos mínimos para reproduzir e uma forma segura de contato. Não acesse contas, sessões ou dados de outras pessoas durante o teste.

O branch `main` representa a versão publicada. Correções de segurança são priorizadas conforme impacto e possibilidade de exploração.

## Configuração segura

- Variáveis com prefixo `VITE_` entram no JavaScript público e nunca devem conter chaves privadas, tokens ou senhas.
- O Google OAuth Client ID é um identificador público e deve ser protegido no Google Cloud por origens JavaScript autorizadas.
- Segredos de serviços devem ficar no provedor que executa o backend, como Cloudflare Workers Secrets, e não no Git, GitHub Pages ou armazenamento persistente do navegador.
- O arquivo `.env.local` é ignorado pelo Git. O `.env.example` contém somente nomes e valores fictícios.
