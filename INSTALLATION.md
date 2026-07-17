# Installation

## Offline-Oberfläche

1. ZIP-Datei nach **C:\Users\xxps3\Desktop\Desktop-Webseite** entpacken.
2. **index.html** doppelklicken.

## Vollständiger PHP/SQLite-Betrieb

1. PHP 8.1 oder neuer installieren.
2. In einem Terminal prüfen:

   ~~~text
   php -v
   php -m
   ~~~

3. In der Modulliste müssen PDO und pdo_sqlite stehen.
4. **scripts\start-server.bat** doppelklicken.
5. **http://127.0.0.1:8000** öffnen.
6. Chat öffnen und registrieren.

Die Datenbank wird beim ersten API-Aufruf automatisch unter **data\desktop.sqlite** erstellt.

## Manueller SQL-Import

Normalerweise ist kein manueller Import nötig. Falls eine externe SQLite-Verwaltung verwendet wird, **database\schema.sql** in eine leere SQLite-Datenbank importieren und die fertige Datei als **data\desktop.sqlite** ablegen.

## Datensicherung

- Browser-Daten: Einstellungen > Import & Export > JSON exportieren.
- Chat-Datenbank: bei beendetem Server **data\desktop.sqlite** kopieren.
- Server-Medien: zusätzlich den Ordner **uploads** sichern.

