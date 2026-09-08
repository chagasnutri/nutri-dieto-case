@echo off
echo ========================================================
echo DIETOCASE - ENVIANDO TODOS OS ARQUIVOS PARA O GITHUB
echo ========================================================
git add .
git commit -m "Forcando envio da raiz e banco de dados"
git push
echo.
echo Sincronizacao concluida!
pause
