$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$artifactDir = "C:\Users\Chagas\.gemini\antigravity\brain\41678dad-1e12-47dd-a58e-6672a4a4e26b"
$baseDir = "C:\Users\Chagas\.gemini\antigravity\scratch\dietoterapia-simulador"
$indexFile = Join-Path $baseDir "index.html"
$fileUrl = "file:///" + $indexFile.Replace('\', '/')

Write-Host "1. Capturando screenshot_aluno_bifurcacao_modos.png..."
$out1 = Join-Path $artifactDir "screenshot_aluno_bifurcacao_modos.png"
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1440,980", "--allow-file-access-from-files", "--virtual-time-budget=4000", "--screenshot=$out1", "$fileUrl" -Wait
if (Test-Path $out1) { Write-Host "OK 1: $out1 ($( (Get-Item $out1).Length ) bytes)" }

Write-Host "2. Capturando screenshot_aluno_simulado_hipotese.png..."
$out2 = Join-Path $artifactDir "screenshot_aluno_simulado_hipotese.png"
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1440,1150", "--allow-file-access-from-files", "--virtual-time-budget=4000", "--screenshot=$out2", "$fileUrl`?view=simulation&tab=anamnese" -Wait
if (Test-Path $out2) { Write-Host "OK 2: $out2 ($( (Get-Item $out2).Length ) bytes)" }

Write-Host "3. Capturando screenshot_aluno_atendimento_real.png..."
$out3 = Join-Path $artifactDir "screenshot_aluno_atendimento_real.png"
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1440,1150", "--allow-file-access-from-files", "--virtual-time-budget=4000", "--screenshot=$out3", "$fileUrl`?view=real&tab=anamnese" -Wait
if (Test-Path $out3) { Write-Host "OK 3: $out3 ($( (Get-Item $out3).Length ) bytes)" }

Write-Host "4. Capturando screenshot_aluno_droga_nutriente.png..."
$out4 = Join-Path $artifactDir "screenshot_aluno_droga_nutriente.png"
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1440,1150", "--allow-file-access-from-files", "--virtual-time-budget=4000", "--screenshot=$out4", "$fileUrl`?view=real&tab=droganutriente" -Wait
if (Test-Path $out4) { Write-Host "OK 4: $out4 ($( (Get-Item $out4).Length ) bytes)" }
