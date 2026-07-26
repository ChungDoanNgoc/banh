@echo off
title Deploy to Firebase Hosting Free
set PATH=E:\JAVA\node-portable;E:\JAVA\SRC\PortableGit\cmd;%PATH%
cd /d E:\JAVA\Banh

echo ===================================================
echo   BUOC 1: DONG GOI MA NGUON UNG DUNG NEXT.JS
echo ===================================================
call npm.cmd run build

echo.
echo ===================================================
echo   BUOC 2: DEPLOY LEN FIREBASE HOSTING (MIEN PHI)
echo ===================================================
call npx.cmd firebase deploy --only hosting

echo.
echo ===================================================
echo   HOAN TAT DEPLOY! NHAN PHIM BAT KY DE THOAT
echo ===================================================
pause
