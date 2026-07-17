@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

set "PHP_BIN=php"
where php >nul 2>nul
if errorlevel 1 (
  set "PHP_BIN=%LOCALAPPDATA%\Programs\PHP\php.exe"
  if not exist "%LOCALAPPDATA%\Programs\PHP\php.exe" (
    echo.
    echo PHP wurde nicht gefunden.
    echo Installiere PHP 8.1 oder neuer und aktiviere PDO sowie pdo_sqlite.
    echo Danach dieses Skript erneut starten.
    echo.
    pause
    exit /b 1
  )
)

"%PHP_BIN%" -r "exit(extension_loaded('pdo_sqlite') ? 0 : 1);"
if errorlevel 1 (
  echo.
  echo Die PHP-Erweiterung pdo_sqlite ist nicht aktiv.
  echo Aktiviere pdo_sqlite in der verwendeten php.ini und starte erneut.
  echo.
  pause
  exit /b 1
)

set "PORT="
for /f %%P in ('powershell -NoProfile -Command "$port=8000; while ($port -le 8010 -and (Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue)) { $port++ }; if ($port -le 8010) { $port }"') do set "PORT=%%P"

if not defined PORT (
  echo.
  echo Zwischen Port 8000 und 8010 wurde kein freier Anschluss gefunden.
  echo Beende einen alten lokalen Server und starte dieses Skript erneut.
  echo.
  pause
  exit /b 1
)

set "BUILD=20260717-17-%RANDOM%%RANDOM%"
set "URL=http://127.0.0.1:%PORT%/?build=%BUILD%"

echo.
echo Patrick Desktop - aktueller Build 2026.07.17.17
echo Projektordner: %CD%
echo Adresse: %URL%
echo Dieses Fenster offen lassen. Beenden mit Strg+C.
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%URL%'"
"%PHP_BIN%" -d opcache.enable_cli=0 -S 127.0.0.1:%PORT% -t "%CD%" "%CD%\router.php"

endlocal
