@echo off
title Push Banh Tieu Project to GitHub
set PATH=E:\JAVA\SRC\PortableGit\cmd;%PATH%
cd /d E:\JAVA\Banh

echo ===================================================
echo   BUOC 1: CAU HINH THONG TIN GITHUB CHUNGDOANNGOC
echo ===================================================
call git config user.email "chungdn141094@gmail.com"
call git config user.name "ChungDoanNgoc"

call git init
call git branch -M main
call git remote remove origin >nul 2>&1
call git remote add origin https://github.com/ChungDoanNgoc/banh.git

echo.
echo ===================================================
echo   BUOC 2: THEM TOAN BO CODE VA COMMIT
echo ===================================================
call git add .
call git commit -m "Initial commit Banh Tieu & Coffee System"

echo.
echo ===================================================
echo   BUOC 3: PUSH CODE LEN GITHUB REPOSITORY
echo ===================================================
call git push -u origin main

echo.
echo ===================================================
echo   HOAN TAT PUSH CODE! NHAN PHIM BAT KY DE THOAT
echo ===================================================
pause
