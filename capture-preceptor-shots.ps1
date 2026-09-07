$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$art = "C:\Users\Chagas\.gemini\antigravity\brain\41678dad-1e12-47dd-a58e-6672a4a4e26b"
$baseDir = "C:\Users\Chagas\.gemini\antigravity\scratch\dietoterapia-simulador"

$fabUrl = "file:///" + (Join-Path $baseDir "preview-fab.html").Replace('\', '/')
$drawerUrl = "file:///" + (Join-Path $baseDir "preview-drawer.html").Replace('\', '/')

$outFabPng = Join-Path $art "screenshot_preceptor_fab.png"
$outDrawerPng = Join-Path $art "screenshot_preceptor_drawer_aberto.png"

Write-Host "Capturando FAB..."
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1200,800", "--virtual-time-budget=2000", "--screenshot=$outFabPng", $fabUrl -Wait
Write-Host "FAB Screenshot OK: $( (Get-Item $outFabPng).Length ) bytes"

Write-Host "Capturando Drawer aberto..."
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1200,900", "--virtual-time-budget=2000", "--screenshot=$outDrawerPng", $drawerUrl -Wait
Write-Host "Drawer Screenshot OK: $( (Get-Item $outDrawerPng).Length ) bytes"
exit 0

