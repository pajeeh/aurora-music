$ErrorActionPreference = 'Stop'
$companion = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repository = (Resolve-Path (Join-Path $companion '..\..')).Path
$artifacts = Join-Path $repository 'artifacts'
$package = Join-Path $artifacts 'Aurora-Discord-Companion-v0.1.1-Windows-x64-EXTRAIA-E-CLIQUE-EM-INSTALAR'
$archive = "$package.zip"
$node = (Get-Command node -ErrorAction Stop).Source
$nodeRoot = Split-Path $node
$helper = Join-Path $companion 'native-social-sdk\target\release\aurora-discord-social-sdk.exe'
$sdkRoot = Join-Path $companion 'vendor\discord_social_sdk'
$sdkDll = Join-Path $sdkRoot 'bin\release\discord_partner_sdk.dll'

foreach ($required in @($helper, $sdkDll, (Join-Path $nodeRoot 'LICENSE'))) {
  if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "Arquivo necessário ausente: $required" }
}
New-Item -ItemType Directory -Force -Path $artifacts | Out-Null
if (Test-Path -LiteralPath $package) {
  $resolvedPackage = (Resolve-Path -LiteralPath $package).Path
  $resolvedArtifacts = (Resolve-Path -LiteralPath $artifacts).Path
  if (-not $resolvedPackage.StartsWith($resolvedArtifacts, [StringComparison]::OrdinalIgnoreCase)) { throw 'Destino do pacote inválido.' }
  Remove-Item -LiteralPath $resolvedPackage -Recurse -Force
}
if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }

New-Item -ItemType Directory -Force -Path $package | Out-Null
Copy-Item -LiteralPath (Join-Path $companion 'src') -Destination $package -Recurse
Copy-Item -LiteralPath (Join-Path $companion 'node_modules') -Destination $package -Recurse
Get-ChildItem -LiteralPath (Join-Path $companion 'distribution') -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $package -Recurse
}
Copy-Item -LiteralPath $node -Destination (Join-Path $package 'node.exe')
Copy-Item -LiteralPath (Join-Path $nodeRoot 'LICENSE') -Destination (Join-Path $package 'NODE-LICENSE.txt')
New-Item -ItemType Directory -Force -Path (Join-Path $package 'native-social-sdk\target\release') | Out-Null
Copy-Item -LiteralPath $helper -Destination (Join-Path $package 'native-social-sdk\target\release\aurora-discord-social-sdk.exe')
New-Item -ItemType Directory -Force -Path (Join-Path $package 'vendor\discord_social_sdk\bin\release') | Out-Null
Copy-Item -LiteralPath $sdkDll -Destination (Join-Path $package 'vendor\discord_social_sdk\bin\release\discord_partner_sdk.dll')
Copy-Item -LiteralPath (Join-Path $sdkRoot 'License-Notices.txt') -Destination (Join-Path $package 'DISCORD-SDK-NOTICES.txt')
Compress-Archive -LiteralPath $package -DestinationPath $archive -CompressionLevel Optimal
$stream = [IO.File]::OpenRead($archive)
try {
  $sha256 = [Security.Cryptography.SHA256]::Create()
  try { $hash = ([BitConverter]::ToString($sha256.ComputeHash($stream))).Replace('-', '') }
  finally { $sha256.Dispose() }
} finally { $stream.Dispose() }
[IO.File]::WriteAllText("$archive.sha256", "$hash  $(Split-Path $archive -Leaf)`n", [Text.UTF8Encoding]::new($false))
Write-Host "Pacote criado: $archive"
Write-Host "SHA256: $hash"
