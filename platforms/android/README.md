# Aurora Android

Projeto Android gerado com Bubblewrap 1.25 para abrir a PWA pública em uma Trusted Web Activity.

## Configuração

- application ID: `com.pajeeh.aurora`
- min SDK: 21
- target/compile SDK: 36
- conteúdo: `https://pajeeh.github.io/aurora-music/?source=android`
- fallback antes da associação do domínio: Custom Tab seguro

## Build local sem assinatura

```bash
cd platforms/android
npx --yes @bubblewrap/cli build --skipSigning
```

O build produz `app-release-unsigned-aligned.apk` e `app/build/outputs/bundle/release/app-release.aab`. Esses artefatos não entram no Git.

Para um APK instalável de teste, use `./gradlew assembleDebug --no-daemon`. O resultado fica em `app/build/outputs/apk/debug/app-debug.apk` e usa somente a chave de desenvolvimento do Android.

## Build de distribuição

1. Defina um domínio permanente do Aurora.
2. Atualize `host`, `startUrl`, `fullScopeUrl`, os ícones e atalhos em `twa-manifest.json`.
3. Crie a chave de upload e guarde o arquivo e as senhas fora do repositório.
4. Gere o fingerprint SHA-256 e publique `assetlinks.json` em `https://DOMINIO/.well-known/assetlinks.json`.
5. Execute `bubblewrap update` e depois `bubblewrap build` com a chave de upload.
6. Use Play App Signing na distribuição da Play Store.

Sem Digital Asset Links válido, o aplicativo abre como Custom Tab com barra do navegador. Isso é adequado para desenvolvimento, mas não é considerado uma versão final para a loja.
