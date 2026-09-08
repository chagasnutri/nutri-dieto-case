@echo off
title DietoCase - Sincronizacao Completa GitHub
color 0A

:: Navega para o diretorio do projeto
cd /d "%~dp0"

echo ======================================================================
echo   DIETOCASE - SINCRONIZACAO COMPLETA (RAIZ E SUBPASTAS) PARA O GITHUB
echo ======================================================================
echo.

echo [1/4] Adicionando todas as modificacoes da raiz e subdiretorios (git add .)...
git add .
echo.

echo [2/4] Verificando status dos arquivos a serem sincronizados...
git status -s
echo.

echo [3/4] Criando commit com todas as alteracoes pendentes...
git commit -m "chore(sync): sincronizacao completa de arquivos da raiz, configs e subpastas"
echo.

echo [4/4] Enviando alteracoes para o GitHub (origin main) e acionando Vercel...
git push origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo   [SUCESSO] Todo o projeto (raiz, configs, subpastas) foi sincronizado!
    echo   Deploy na Vercel acionado com sucesso.
    echo ======================================================================
) else (
    echo ======================================================================
    echo   [AVISO] Tentando envio com git push -u origin main...
    echo ======================================================================
    git push -u origin main
)

echo.
pause
