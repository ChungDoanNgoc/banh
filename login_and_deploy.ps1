$env:PATH = "E:\JAVA\node-portable;" + $env:PATH
Set-Location "E:\JAVA\Banh"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  BUOC 1: DANG NHAP VAO TAI KHOAN FIREBASE" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan
npx.cmd firebase login

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  BUOC 2: DEPLOY UNG DUNG LEN FIREBASE HOSTING" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
npx.cmd firebase deploy --only hosting

Write-Host ""
Write-Host "HOAN TAT DEPLOY!" -ForegroundColor Green
