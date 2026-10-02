param(
  [string]$Archive = "$env:USERPROFILE\Downloads\DiscordSocialSdk-1.10.19337.zip"
)

$ErrorActionPreference = 'Stop'
$ExpectedHash = 'D784097504685953849CC2842561D8A8013326FE0B8DF65A1DE63DDEFDE62045'
$CompanionRoot = Split-Path -Parent $PSScriptRoot
$VendorRoot = Join-Path $CompanionRoot 'vendor'
$InstallRoot = Join-Path $VendorRoot 'discord_social_sdk'

if (-not (Test-Path -LiteralPath $Archive -PathType Leaf)) {
  throw "SDK não encontrado em $Archive. Baixe o pacote principal pelo Discord Developer Portal."
}

$HashStream = [System.IO.File]::OpenRead($Archive)
try {
  $Sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    $ActualHash = ([BitConverter]::ToString($Sha256.ComputeHash($HashStream))).Replace('-', '')
  } finally {
    $Sha256.Dispose()
  }
} finally {
  $HashStream.Dispose()
}
if ($ActualHash -ne $ExpectedHash) {
  throw "Checksum inesperado para o Discord Social SDK. Esperado: $ExpectedHash; recebido: $ActualHash"
}

if (Test-Path -LiteralPath $VendorRoot) {
  $ResolvedVendor = (Resolve-Path -LiteralPath $VendorRoot).Path
  $ResolvedCompanion = (Resolve-Path -LiteralPath $CompanionRoot).Path
  if (-not $ResolvedVendor.StartsWith($ResolvedCompanion, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'O diretório vendor não pertence ao Aurora Companion.'
  }
  Remove-Item -LiteralPath $VendorRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $VendorRoot | Out-Null
Expand-Archive -LiteralPath $Archive -DestinationPath $VendorRoot -Force

if (-not (Test-Path -LiteralPath (Join-Path $InstallRoot 'include\cdiscord.h'))) {
  throw 'O pacote foi extraído, mas a API do Discord não foi encontrada.'
}

Write-Host "Discord Social SDK instalado localmente em $InstallRoot"
