@echo off
setlocal
title Instalar Aurora Discord Companion
echo.
echo ==============================================
echo       AURORA DISCORD COMPANION - WINDOWS
echo ==============================================
echo.
echo O Aurora sera instalado e iniciado com o Windows.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo.
  echo A instalacao nao foi concluida. Execute DIAGNOSTICO.cmd para conferir o computador.
  pause
  exit /b 1
)
echo.
echo O navegador sera aberto no Aurora.
echo Entre na sua conta e abra: Discord - Tocando agora.
start "" "https://pajeeh.github.io/aurora-music/?discord=setup"
echo.
pause
echo Digite abaixo o codigo de 8 digitos exibido pelo Aurora.
"%LOCALAPPDATA%\Programs\Aurora Companion\node.exe" "%LOCALAPPDATA%\Programs\Aurora Companion\src\index.mjs" pair
if errorlevel 1 (
  echo.
  echo Nao foi possivel conectar. Gere outro codigo e execute PAREAR-NOVAMENTE.cmd.
  pause
  exit /b 1
)
start "Aurora Discord Companion" /min "%LOCALAPPDATA%\Programs\Aurora Companion\start.cmd"
echo.
echo Pronto. Toque uma musica no Aurora e abra o seu perfil no Discord.
pause
