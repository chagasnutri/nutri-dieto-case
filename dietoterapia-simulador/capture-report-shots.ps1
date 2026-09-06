$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$art = "C:\Users\Chagas\.gemini\antigravity\brain\41678dad-1e12-47dd-a58e-6672a4a4e26b"
$baseDir = "C:\Users\Chagas\.gemini\antigravity\scratch\dietoterapia-simulador"

$repUrl = "file:///" + (Join-Path $baseDir "preview-report.html").Replace('\', '/')
$modUrl = "file:///" + (Join-Path $baseDir "preview-modal.html").Replace('\', '/')

$out1 = Join-Path $art "screenshot_relatorio_final_consolidado.png"
$out2 = Join-Path $art "screenshot_modal_emissao_word_pdf.png"

Write-Host "Capturando relatorio completo..."
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1200,4800", "--virtual-time-budget=3000", "--screenshot=$out1", $repUrl -Wait
Write-Host "Relatorio gerado: $( (Get-Item $out1).Length ) bytes"

Write-Host "Capturando modal..."
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1200,800", "--virtual-time-budget=3000", "--screenshot=$out2", $modUrl -Wait
Write-Host "Modal gerado: $( (Get-Item $out2).Length ) bytes"
