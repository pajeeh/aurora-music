@echo off
title Parear Aurora Discord Companion
start "" "https://pajeeh.github.io/aurora-music/?discord=setup"
echo Gere um novo codigo em Discord - Tocando agora.
"%~dp0node.exe" "%~dp0src\index.mjs" pair
pause
