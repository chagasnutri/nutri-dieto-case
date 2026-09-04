# Executa e valida a suíte de testes do DietoCase
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$suiteFile = Join-Path $baseDir "test-suite.html"
$outputHtml = Join-Path $baseDir "test-output.html"

Write-Host "Executando testes automatizados no Edge headless..."
Start-Process -FilePath $edgePath -ArgumentList "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--virtual-time-budget=8000", "--dump-dom", $suiteFile -RedirectStandardOutput $outputHtml -Wait

if (Test-Path $outputHtml) {
    $raw = Get-Content -Path $outputHtml -Raw
    if ($raw -match '<div id="results">([\s\S]*?)<\/div>') {
        $matchesResults = $matches[1]
        Write-Host "=================== RESULTADOS DOS TESTES ==================="
        $matchesResults -split '<div' | ForEach-Object {
            $line = $_ -replace '<[^>]+>', '' -replace '\s+', ' '
            $line = $line.Trim()
            if ($line -match 'PASS:' -or $line -match 'FAIL:') {
                Write-Host $line
            }
        }
        Write-Host "============================================================="
        if ($matchesResults -match 'FAIL') {
            Write-Error "Algum teste falhou!"
            exit 1
        } else {
            Write-Host "TODOS OS TESTES FORAM EXECUTADOS E PASSARAM COM SUCESSO!"
            exit 0
        }
    } else {
        Write-Warning "Tag #results não continha resultados."
    }
}
