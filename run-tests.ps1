# Executa e valida a suíte de testes do DietoCase
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$suiteFile = Join-Path $baseDir "test-suite.html"
$fileUrl = "file:///" + $suiteFile.Replace('\', '/')
$outputHtml = Join-Path $baseDir "test-output.html"

Write-Host "Executando testes automatizados no Edge headless..."
Start-Process -FilePath $edgePath -ArgumentList "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--virtual-time-budget=6000", "--dump-dom", $fileUrl -RedirectStandardOutput $outputHtml -Wait

if (Test-Path $outputHtml) {
    $raw = Get-Content -Path $outputHtml -Raw
    $resultsBlock = ""
    if ($raw -match '(?s)<div id="results">(.*?)<\/body>') {
        $resultsBlock = $matches[1]
    } else {
        $resultsBlock = $raw
    }
    $allMatches = [regex]::Matches($resultsBlock, '(PASS:|FAIL:|GLOBAL ERROR:|UNHANDLED REJECTION:)[^<]+')

    Write-Host "=================== RESULTADOS DOS TESTES ==================="
    $passCount = 0
    $failCount = 0
    $errorCount = 0

    foreach ($m in $allMatches) {
        $val = $m.Value.Trim()
        if ($val -match 'PASS:') {
            $passCount++
        } elseif ($val -match 'FAIL:') {
            $failCount++
            Write-Host "FALHA: $val" -ForegroundColor Red
        } else {
            $errorCount++
            Write-Host "ERRO: $val" -ForegroundColor Red
        }
    }

    Write-Host "============================================================="
    Write-Host "Total de testes aprovados: $passCount"
    Write-Host "Total de falhas: $failCount"
    Write-Host "Total de erros globais: $errorCount"

    if ($failCount -gt 0 -or $errorCount -gt 0 -or $passCount -eq 0) {
        Write-Error "A suíte de testes falhou!"
        exit 1
    } else {
        Write-Host "TODOS OS $passCount TESTES FORAM EXECUTADOS E PASSARAM COM SUCESSO!"
        exit 0
    }
}
