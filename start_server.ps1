# Disc Run 3D - High Compatibility Local Game Server (No Admin Needed)
param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Continue"
$projectDir = $PSScriptRoot
Set-Location $projectDir

# Detect active local Wi-Fi / LAN IP address
$localIP = "127.0.0.1"
try {
    $addresses = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName())
    foreach ($addr in $addresses) {
        if ($addr.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) {
            $str = $addr.IPAddressToString
            if ($str -notlike "127.*" -and $str -notlike "169.254.*") {
                $localIP = $str
                break
            }
        }
    }
} catch {}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".mp3"  = "audio/mpeg"
    ".wav"  = "audio/wav"
    ".webm" = "video/webm"
    ".mp4"  = "video/mp4"
}

# Use raw TcpListener on 0.0.0.0 (IPAddress.Any) to bypass http.sys hostname restrictions completely
$tcpListener = $null
try {
    $tcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
    $tcpListener.Start()
} catch {
    $Port = 8081
    $tcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
    $tcpListener.Start()
}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       DISC RUN 3D - LOCAL GAME SERVER RUNNING            " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [PC Browser URL]   : " -NoNewline
Write-Host "http://localhost:$Port" -ForegroundColor Green
Write-Host ""
Write-Host " [Phone Browser URL]: " -NoNewline
Write-Host "http://$($localIP):$Port" -ForegroundColor Yellow -BackgroundColor Black
Write-Host ""
Write-Host " >> HOW TO PLAY ON YOUR PHONE:" -ForegroundColor White
Write-Host " 1. Make sure your phone is connected to the SAME Wi-Fi as this PC."
Write-Host " 2. Open Chrome on your phone and type: http://$($localIP):$Port"
Write-Host " 3. Tap the 3 dots in Chrome > Install app or Add to Home screen."
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$buffer = New-Object byte[] 4096

while ($true) {
    try {
        $client = $tcpListener.AcceptTcpClient()
        $stream = $client.GetStream()
        $stream.ReadTimeout = 3000
        $stream.WriteTimeout = 5000

        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        if ($bytesRead -gt 0) {
            $requestStr = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
            $firstLine = $requestStr.Split("`r`n")[0]
            $tokens = $firstLine.Split(" ")

            if ($tokens.Length -ge 2) {
                $rawUrl = $tokens[1]
                # Strip query params / hash
                if ($rawUrl.Contains("?")) { $rawUrl = $rawUrl.Substring(0, $rawUrl.IndexOf("?")) }
                if ($rawUrl.Contains("#")) { $rawUrl = $rawUrl.Substring(0, $rawUrl.IndexOf("#")) }
                if ($rawUrl -eq "/" -or [string]::IsNullOrWhiteSpace($rawUrl)) { $rawUrl = "/index.html" }

                $relPath = [System.Uri]::UnescapeDataString($rawUrl).TrimStart("/").Replace("/", "\")
                $filePath = Join-Path $projectDir $relPath

                if (Test-Path $filePath -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $mime = $mimeTypes[$ext]
                    if (-not $mime) { $mime = "application/octet-stream" }

                    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                    $header = "HTTP/1.1 200 OK`r`n" +
                              "Content-Type: $mime`r`n" +
                              "Content-Length: $($fileBytes.Length)`r`n" +
                              "Access-Control-Allow-Origin: *`r`n" +
                              "Cache-Control: no-cache`r`n" +
                              "Connection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)

                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($fileBytes, 0, $fileBytes.Length)
                } else {
                    $notFoundBody = "<html><body><h1>404 Not Found</h1><p>$rawUrl</p></body></html>"
                    $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes($notFoundBody)
                    $header = "HTTP/1.1 404 Not Found`r`n" +
                              "Content-Type: text/html; charset=utf-8`r`n" +
                              "Content-Length: $($notFoundBytes.Length)`r`n" +
                              "Connection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($notFoundBytes, 0, $notFoundBytes.Length)
                }
            }
        }
        $stream.Flush()
        $client.Close()
    } catch {
        # Continue on client abort
        if ($client) { try { $client.Close() } catch {} }
    }
}
