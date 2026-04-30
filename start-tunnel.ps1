# start-tunnel.ps1
$port = 8080
Write-Host "Starting Cloudflare Tunnel on port $port..." -ForegroundColor Cyan

$process = Start-Process -FilePath ".\cloudflared.exe" -ArgumentList "tunnel --url http://localhost:$port" -NoNewWindow -PassThru -RedirectStandardError "tunnel.log"

Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow

$url = $null
while ($null -eq $url) {
    if (Test-Path "tunnel.log") {
        $content = Get-Content "tunnel.log" -ErrorAction SilentlyContinue
        $urlLine = $content | Select-String -Pattern "https://.*\.trycloudflare\.com"
        if ($urlLine) {
            $url = $urlLine.Matches.Value.Trim()
            Write-Host "`n"
            Write-Host "===============================================" -ForegroundColor Green
            Write-Host "  TUNNEL IS READY!" -ForegroundColor Green
            Write-Host "  URL: $url" -ForegroundColor White -BackgroundColor DarkGreen
            Write-Host "===============================================" -ForegroundColor Green
            Write-Host "`nCopy the URL above and paste it in Vercel VITE_API_URL."
            Write-Host "Press Ctrl+C to stop the tunnel."
        }
    }
    Start-Sleep -Seconds 1
}

# Keep the script alive while the process is running
try {
    Wait-Process -Id $process.Id
} finally {
    Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
    Remove-Item "tunnel.log" -ErrorAction SilentlyContinue
}
