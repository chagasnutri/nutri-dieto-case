$port = 8080
$basePath = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$dbFile = Join-Path $basePath "data\dietocase-db.json"
$logFile = Join-Path $basePath "server.log"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    "Servidor iniciado em http://localhost:$port/" | Out-File $logFile
} catch {
    $port = 8085
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    "Servidor iniciado em http://localhost:$port/ (porta 8085 alternativa)" | Out-File $logFile
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, X-Teacher-Password, Authorization")

        # Tratamento de preflight CORS OPTIONS
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        $relPath = $request.Url.LocalPath

        # ROTA DE API: Sincronização centralizada de casos e disciplinas
        if ($relPath -eq "/api/data") {
            $response.ContentType = "application/json; charset=utf-8"
            $response.AddHeader("Cache-Control", "no-store, no-cache, must-revalidate")

            if ($request.HttpMethod -eq "GET") {
                if (Test-Path $dbFile -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($dbFile)
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $fallbackJson = '{"app":"DietoCase","version":2,"updatedAt":"' + (Get-Date).ToString("o") + '","disciplinas":[],"cases":[]}'
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fallbackJson)
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
                $response.Close()
                continue
            }

            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyText = $reader.ReadToEnd()
                $reader.Close()

                $pwdHeader = $request.Headers["X-Teacher-Password"]
                $authorized = ($pwdHeader -eq "Nutri2@26")

                # Também verifica se a senha veio no JSON do body
                $parsedBody = $null
                try {
                    $parsedBody = ConvertFrom-Json $bodyText
                    if ($parsedBody.password -eq "Nutri2@26") {
                        $authorized = $true
                    }
                } catch {
                    "Erro ao converter JSON do body: $_" | Out-File $logFile -Append
                }

                if (-not $authorized) {
                    $response.StatusCode = 401
                    $errJson = '{"success":false,"message":"Senha do professor nao autorizada para sincronizar no servidor."}'
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                # Salva o novo estado mestre com timestamp atual
                $updatedAt = (Get-Date).ToString("o")
                $dbPayload = [PSCustomObject]@{
                    app = "DietoCase"
                    version = 2
                    updatedAt = $updatedAt
                    disciplinas = $parsedBody.disciplinas
                    cases = $parsedBody.cases
                }
                $jsonOut = ConvertTo-Json $dbPayload -Depth 12
                $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
                [System.IO.File]::WriteAllText($dbFile, $jsonOut, $utf8NoBom)

                $respJson = '{"success":true,"message":"Casos e disciplinas sincronizados no servidor com sucesso!","updatedAt":"' + $updatedAt + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
        }

        # Servidor de arquivos estáticos
        if ($relPath -eq "/" -or [string]::IsNullOrWhiteSpace($relPath)) {
            $relPath = "/index.html"
        }

        $filePath = Join-Path $basePath $relPath.TrimStart('/')

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $mime = $mimeTypes[$ext]
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        "Erro na requisicao: $($_.Exception.Message)" | Out-File $logFile -Append
    }
}
