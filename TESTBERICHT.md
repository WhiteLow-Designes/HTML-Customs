# Testbericht

Stand: 17.07.2026

## Erfolgreich geprüft

- JavaScript-Syntax von assets/js/app.js
- JavaScript-Syntax des Service Workers
- 34 eindeutige HTML-IDs
- alle lokalen HTML-Verweise vorhanden
- gültiges Web-App-Manifest
- HTTP-Status 200 für Startseite, CSS, JavaScript, Manifest, Service Worker und Hintergrundbild
- vollständige Ausführung von database/schema.sql in einer frischen SQLite-Datenbank
- 20 erwartete Datenbanktabellen vorhanden
- vier Chaträume und Systemnachricht korrekt angelegt
- keine Fremdschlüsselverletzungen
- konsistente Blockstruktur aller PHP-Dateien
- keine leeren Projektdateien
- vollständige ZIP-Struktur einschließlich versteckter Schutzdateien
- identische SHA-256-Prüfsumme der ZIP-Datei im Ausgabeordner und auf dem Desktop

## Umgebungshinweise

Auf dem lokalen Rechner war zum Testzeitpunkt noch kein PHP installiert. Deshalb konnten die PHP-Endpunkte nicht mit einem echten PHP-Prozess ausgeführt werden. Das SQLite-Schema wurde unabhängig vollständig ausgeführt und geprüft; für den API-Laufzeittest bitte nach der Installation von PHP scripts/start-server.bat starten.

Der eingebettete Prüf-Browser hat den Zugriff auf den lokalen Testserver durch seine eigene Sicherheitsrichtlinie blockiert. Die HTTP-Auslieferung wurde stattdessen direkt geprüft. Das originale, iconfreie Hintergrundbild wurde visuell mit dem bereitgestellten Desktop-Screenshot abgeglichen.

