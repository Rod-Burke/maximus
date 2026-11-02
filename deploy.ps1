# deploy.ps1
# Automatically stage, commit, and push changes to GitHub Pages
#
# Usage:
#   .\deploy.ps1                # Deploys current staged/unstaged changes
#   .\deploy.ps1 -Bump          # Auto-increments version (e.g. v132 -> v133), syncs all files, deploys & waits for live confirmation
#   .\deploy.ps1 -Version 134   # Explicitly bumps to v134, syncs all files, deploys & waits for live confirmation
#   .\deploy.ps1 -Wait          # Deploys and polls until GitHub Pages is confirmed live

param(
    [switch]$Bump,
    [string]$Version = "",
    [switch]$Wait
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$swFile = Join-Path $PSScriptRoot "sw.js"
$htmlFile = Join-Path $PSScriptRoot "index.html"
$appFile = Join-Path $PSScriptRoot "app.js"

# 1. Determine Current Version
$currentSw = Get-Content $swFile -Raw -Encoding utf8
if ($currentSw -match "CACHE_NAME\s*=\s*'maximus-v(\d+)") {
    $currentVerNum = [int]$Matches[1]
} else {
    Write-Warning "Could not detect version number from sw.js. Defaulting to 132."
    $currentVerNum = 132
}

$targetVerNum = $null
if ($Version) {
    if ($Version -match "^v?(\d+)") {
        $targetVerNum = [int]$Matches[1]
    } else {
        Write-Error "Invalid version string provided: $Version. Please provide a number like 133 or v133."
        exit 1
    }
} elseif ($Bump) {
    $targetVerNum = $currentVerNum + 1
}

if ($targetVerNum) {
    Write-Host "`n>>> Bumping Maximus PWA version from v$currentVerNum to v$targetVerNum..." -ForegroundColor Cyan

    # A. Update sw.js
    $newSw = $currentSw -replace "CACHE_NAME\s*=\s*'maximus-v[^']+'", "CACHE_NAME = 'maximus-v$targetVerNum'"
    [System.IO.File]::WriteAllText($swFile, $newSw, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] Updated sw.js (CACHE_NAME: 'maximus-v$targetVerNum')" -ForegroundColor Green

    # B. Update index.html
    $htmlContent = Get-Content $htmlFile -Raw -Encoding utf8
    $htmlContent = $htmlContent -replace 'style\.css\?v=\d+', "style.css?v=$targetVerNum"
    $htmlContent = $htmlContent -replace 'app\.js\?v=\d+', "app.js?v=$targetVerNum"
    $htmlContent = $htmlContent -replace 'id="update-toast-version">v?\d+<', "id=`"update-toast-version`">v$targetVerNum<"
    [System.IO.File]::WriteAllText($htmlFile, $htmlContent, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] Updated index.html (style.css?v=$targetVerNum, app.js?v=$targetVerNum, toast)" -ForegroundColor Green

    # C. Update app.js
    $appContent = Get-Content $appFile -Raw -Encoding utf8
    $appContent = $appContent -replace "let versionStr = 'v\d+';", "let versionStr = 'v$targetVerNum';"
    [System.IO.File]::WriteAllText($appFile, $appContent, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] Updated app.js (default versionStr: 'v$targetVerNum')" -ForegroundColor Green
    
    $commitVerTag = "v$targetVerNum"
} else {
    $commitVerTag = "v$currentVerNum"
    Write-Host "`n>>> Deploying Maximus PWA (version: $commitVerTag)..." -ForegroundColor Cyan
}

# 2. Stage, Commit, and Push
git add .
$status = git status --porcelain
if (-not $status) {
    Write-Host "No unstaged changes to deploy." -ForegroundColor Yellow
} else {
    $current_time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Deploy: Maximus PWA $commitVerTag Update - $current_time"
    git push origin main
    Write-Host "PWA successfully pushed to GitHub Pages!" -ForegroundColor Green
}

# 3. Wait/Verify Live Status (if requested or bumped)
if ($Wait -or $targetVerNum) {
    $checkVer = if ($targetVerNum) { "maximus-v$targetVerNum" } else { "maximus-v$currentVerNum" }
    Write-Host "`nWaiting for GitHub Pages CDN deployment of $checkVer..." -ForegroundColor Cyan
    $live = $false
    for ($i = 1; $i -le 18; $i++) {
        Start-Sleep -Seconds 5
        try {
            $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
            $resp = Invoke-RestMethod -Uri "https://rod-burke.github.io/maximus/sw.js?nocache=$ts" -Method GET -TimeoutSec 10
            if ($resp -match $checkVer) {
                Write-Host "Verified live on GitHub Pages! ($checkVer is live)" -ForegroundColor Green
                $live = $true
                break
            } else {
                Write-Host "  Attempt $($i): still building on GitHub Pages..." -ForegroundColor Gray
            }
        } catch {
            Write-Host "  Attempt $($i): waiting for response..." -ForegroundColor Gray
        }
    }
    if (-not $live) {
        Write-Warning "GitHub Pages is still building in the background. It will be live shortly."
    }
}
