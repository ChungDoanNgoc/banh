@echo off
title Deploy Banh Tieu App to Firebase
set PATH=E:\JAVA\node-portable;%PATH%
cd /d E:\JAVA\Banh

echo ===================================================
echo   BUOC 1: DANG NHAP VAO TAI KHOAN FIREBASE
echo ===================================================
call npx firebase login

echo.
echo ===================================================
echo   BUOC 2: DEPLOY UNG DUNG LEN FIREBASE HOSTING
echo ===================================================
call npx firebase deploy --only hosting

echo.
echo ===================================================
echo   HOAN TAT DEPLOY! NHAN PHIM BAT KY DE THOAT
echo ===================================================
pause
