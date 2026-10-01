param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

Add-Type -AssemblyName System.Drawing

$output = Join-Path $ProjectRoot 'store\microsoft\assets'
New-Item -ItemType Directory -Force -Path $output | Out-Null
Copy-Item (Join-Path $ProjectRoot 'public\aurora-desktop.png') (Join-Path $output 'screenshot-desktop-01.png') -Force

function New-AuroraArtwork {
  param([int]$Width, [int]$Height, [string]$Path)

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $rect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(8, 10, 26), [System.Drawing.Color]::FromArgb(91, 45, 145), 35)
  $graphics.FillRectangle($gradient, $rect)

  $glow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 85, 230, 255))
  $diameter = [Math]::Min($Width, $Height) * 0.72
  $graphics.FillEllipse($glow, ($Width - $diameter) / 2, ($Height - $diameter) / 2, $diameter, $diameter)

  $icon = [System.Drawing.Image]::FromFile((Join-Path $ProjectRoot 'public\aurora-icon-512.png'))
  $iconSize = [Math]::Min($Width, $Height) * 0.42
  $graphics.DrawImage($icon, ($Width - $iconSize) / 2, ($Height - $iconSize) / 2, $iconSize, $iconSize)
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $icon.Dispose()
  $glow.Dispose()
  $gradient.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-AuroraArtwork 1080 1080 (Join-Path $output 'store-box-art.png')
New-AuroraArtwork 1440 2160 (Join-Path $output 'store-poster-art.png')
New-AuroraArtwork 1920 1080 (Join-Path $output 'store-hero-art.png')

Write-Output "Microsoft Store assets created in $output"
