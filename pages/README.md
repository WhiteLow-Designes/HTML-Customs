# Dynamische Unterseiten

Die Bereiche Games, Bilder & Videos, Papierkorb, Einstellungen, Raum-Chat und Benutzerprofil werden bewusst nicht als gewöhnliche neue Browserseiten geöffnet. **assets/js/app.js** rendert sie als eigenständige, verschiebbare Windows-11-Fenster innerhalb des Desktops.

Jede dynamische Seite erhält:

- Titelleiste und App-Symbol
- Minimieren, Maximieren und Schließen
- gespeicherte Fensterreihenfolge über Z-Index
- zum Bereich passende Navigation und Befehle
- gemeinsames Theme aus **assets/css/windows11.css**
- responsive Vollbilddarstellung auf kleinen Geräten

Das entspricht der Vorgabe, dass Unterseiten wie Bestandteile desselben Betriebssystems wirken.

