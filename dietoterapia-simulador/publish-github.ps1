# Script auxiliar para publicar o DietoCase no seu repositório GitHub
param(
    [string]$repoUrl
)

$env:PATH = "$env:LOCALAPPDATA\Programs\Git\cmd;$env:PATH"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  DietoCase - Publicacao Automatica no GitHub" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

if (-not $repoUrl) {
    Write-Host "Por favor, informe a URL do seu repositorio no GitHub." -ForegroundColor Yellow
    Write-Host "Exemplo: https://github.com/SEU-USUARIO/dietocase.git" -ForegroundColor Gray
    $repoUrl = Read-Host "URL do Repositorio"
}

if (-not $repoUrl) {
    Write-Error "URL do repositorio nao foi informada. Operacao cancelada."
    exit 1
}

# Verifica se o remote origin ja existe
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Atualizando remote 'origin' para: $repoUrl" -ForegroundColor Cyan
    git remote set-url origin $repoUrl
} else {
    Write-Host "Configurando remote 'origin': $repoUrl" -ForegroundColor Cyan
    git remote add origin $repoUrl
}

Write-Host "Enviando arquivos para a branch 'main' do GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  SUCESSO! O DietoCase foi enviado para o GitHub!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "Para ativar o site gratuito (GitHub Pages):" -ForegroundColor Cyan
    Write-Host "1. Abra seu repositorio no navegador."
    Write-Host "2. Clique em Settings > Pages."
    Write-Host "3. Em 'Build and deployment', escolha 'Deploy from a branch'."
    Write-Host "4. Selecione a branch 'main' e pasta '/ (root)' e clique em 'Save'."
    Write-Host "5. Em 1 minuto seu link estara no ar!" -ForegroundColor Green
} else {
    Write-Error "Ocorreu uma falha no envio. Verifique se o repositorio existe e se voce esta autenticado no GitHub."
}
