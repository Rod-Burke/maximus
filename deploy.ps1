# Automatically stage, commit, and push changes to GitHub Pages
git add .
$current_time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Deploy: Maximus PWA Update - $current_time"
git push origin main
Write-Host "PWA successfully pushed to GitHub Pages! Please wait 1 minute for it to build." -ForegroundColor Green
