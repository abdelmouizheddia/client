cd "D:\WEB IDEE ITO GYM\azzouz gym UPDATED PLATFORM"

@'
$ErrorActionPreference = "Continue"

while ($true) {
    $changes = git status --porcelain

    if ($changes) {
        git add .

        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git commit -m "Auto update: $timestamp"

        if ($LASTEXITCODE -eq 0) {
            git push origin main
            Write-Host "GitHub updated!" -ForegroundColor Green
        }
    }

    Start-Sleep -Seconds 30
}
'@ | Set-Content -Encoding UTF8 "auto-push.ps1"