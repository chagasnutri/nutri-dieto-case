Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Chagas\.gemini\antigravity\brain\dda86515-d251-4c00-9894-60428085a6df\.user_uploaded\media_1788738867879.png"
$baseDir = $PSScriptRoot

Write-Host "Lendo imagem original: $srcPath"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Dimensões originais: $($srcImg.Width)x$($srcImg.Height)"

# Pastas de destino
$destDirs = @(
    (Join-Path $baseDir "icons"),
    (Join-Path $baseDir "public"),
    (Join-Path $baseDir "public\icons")
)

foreach ($dir in $destDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

function Resize-Image([System.Drawing.Image]$source, [int]$width, [int]$height, [string]$outPath, [System.Drawing.Imaging.ImageFormat]$format) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, 0, 0, $width, $height)
    $g.Dispose()

    $bmp.Save($outPath, $format)
    $bmp.Dispose()
    Write-Host "Gerado: $outPath ($width x $height)"
}

# 1. Gera icon-192.png (192x192)
$icon192 = Join-Path $baseDir "icons\icon-192.png"
Resize-Image $srcImg 192 192 $icon192 ([System.Drawing.Imaging.ImageFormat]::Png)
Copy-Item $icon192 (Join-Path $baseDir "public\icons\icon-192.png") -Force

# 2. Gera icon-512.png (512x512)
$icon512 = Join-Path $baseDir "icons\icon-512.png"
Resize-Image $srcImg 512 512 $icon512 ([System.Drawing.Imaging.ImageFormat]::Png)
Copy-Item $icon512 (Join-Path $baseDir "public\icons\icon-512.png") -Force

# 3. Gera apple-touch-icon.png (180x180)
$appleIcon = Join-Path $baseDir "icons\apple-touch-icon.png"
Resize-Image $srcImg 180 180 $appleIcon ([System.Drawing.Imaging.ImageFormat]::Png)
Copy-Item $appleIcon (Join-Path $baseDir "apple-touch-icon.png") -Force
Copy-Item $appleIcon (Join-Path $baseDir "public\apple-touch-icon.png") -Force

# 4. Gera favicon.png (48x48) e favicon-32.png (32x32)
$fav32 = Join-Path $baseDir "icons\favicon-32x32.png"
Resize-Image $srcImg 32 32 $fav32 ([System.Drawing.Imaging.ImageFormat]::Png)
$fav48 = Join-Path $baseDir "icons\favicon.png"
Resize-Image $srcImg 48 48 $fav48 ([System.Drawing.Imaging.ImageFormat]::Png)
Copy-Item $fav48 (Join-Path $baseDir "favicon.png") -Force
Copy-Item $fav48 (Join-Path $baseDir "public\favicon.png") -Force

# 5. Gera favicon.ico real (Icon format)
$favIcoBmp = New-Object System.Drawing.Bitmap($fav48)
$hIcon = $favIcoBmp.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($hIcon)
$icoStream = New-Object System.IO.FileStream((Join-Path $baseDir "favicon.ico"), [System.IO.FileMode]::Create)
$ico.Save($icoStream)
$icoStream.Close()
$favIcoBmp.Dispose()
Write-Host "Gerado: $(Join-Path $baseDir 'favicon.ico')"
Copy-Item (Join-Path $baseDir "favicon.ico") (Join-Path $baseDir "icons\favicon.ico") -Force
Copy-Item (Join-Path $baseDir "favicon.ico") (Join-Path $baseDir "public\favicon.ico") -Force

# Limpa imagens antigas mal-nomeadas se existirem
$bad192 = Join-Path $baseDir "icons\icon-192x192.png.png"
if (Test-Path $bad192) { Remove-Item $bad192 -Force }
$bad512 = Join-Path $baseDir "icons\icon-512x512.png.png"
if (Test-Path $bad512) { Remove-Item $bad512 -Force }

$srcImg.Dispose()
Write-Host "Todas as imagens de ícones foram geradas com sucesso!"
