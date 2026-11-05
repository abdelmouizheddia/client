@echo off
echo ==========================================
echo        AZZOUZ GYM - بدء تشغيل النظام
echo ==========================================
echo.
echo جاري تشغيل الخادم والواجهة، يرجى الانتظار...

:: مسار مشروعك
set PROJECT_PATH="D:\WEB IDEE ITO GYM\ben-tarmoul-v3"

:: تشغيل السيرفر (Backend)
cd /d %PROJECT_PATH%\server
start "Azzouz Gym - Server" cmd /k "npm run dev"

:: تشغيل الواجهة (Frontend)
cd /d %PROJECT_PATH%\client
start "Azzouz Gym - Client" cmd /k "npm run dev"

:: الانتظار 5 ثواني حتى يعمل النظام، ثم فتح المتصفح تلقائياً
timeout /t 5 /nobreak > NUL
start http://localhost:5173

exit