# Script de verificação do DOCX gerado
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$testUrl = [System.Uri](Join-Path $baseDir "test-export.html").AbsoluteUri
$outputHtml = Join-Path $baseDir "export-output.html"
$docxPath = Join-Path $baseDir "Relatorio_Dietoterapia_Teste.docx"

Write-Host "Iniciando Edge headless para exportar DOCX..."
Start-Process -FilePath $edgePath -ArgumentList "--headless=new", "--disable-gpu", "--virtual-time-budget=2000", "--dump-dom", $testUrl -RedirectStandardOutput $outputHtml -Wait

if (Test-Path $outputHtml) {
    $content = Get-Content -Path $outputHtml -Raw
    if ($content -match 'id="base64output">([^<]+)<') {
        $b64 = $matches[1]
        $bytes = [Convert]::FromBase64String($b64)
        [System.IO.File]::WriteAllBytes($docxPath, $bytes)
        Write-Host "DOCX gravado com sucesso! Tamanho: $($bytes.Length) bytes"
        
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
        Write-Host "Verificando estrutura interna do arquivo OpenXML DOCX:"
        foreach ($entry in $zip.Entries) {
            Write-Host " - $($entry.FullName) ($($entry.Length) bytes)"
        }
        $zip.Dispose()
        Write-Host "TESTE CONCLUÍDO COM SUCESSO! Arquivo DOCX válido e íntegro."
    } else {
        Write-Error "Tag base64output não encontrada no HTML gerado."
    }
} else {
    Write-Error "Arquivo export-output.html não foi criado."
}
