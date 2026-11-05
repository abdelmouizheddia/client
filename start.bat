@echo off
start "AZZOUZ GYM - Server" cmd /k "cd server && npm run dev"
start "AZZOUZ GYM - Client" cmd /k "cd client && npm run dev"