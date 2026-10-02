@echo off
rem FSP Deutsch saytini kompyuterda ishga tushiradi (brauzer o'zi ochiladi).
cd /d "%~dp0"
set "PATH=D:\Tools\node;%PATH%"
if not exist node_modules call npm install
call npm run dev
