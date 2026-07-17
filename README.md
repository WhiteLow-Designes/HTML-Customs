# Patrick Desktop - interaktive Windows-11-Webseite

Diese lokale Web-App bildet den persönlichen Desktop aus dem Referenzbild nach. Sie verwendet das originale Samurai-Hintergrundbild, ein Windows-11-inspiriertes Dark-Mode-Theme, frei verschiebbare Symbole, echte Fensterzustände, ein persistentes virtuelles Dateisystem, Medien- und Games-Verwaltung, Einstellungen, Benutzerprofil, Papierkorb sowie einen PHP/SQLite-Raum-Chat.

Die Oberfläche funktioniert sofort im Offline-Modus. Für Registrierung, Anmeldung und Mehrbenutzer-Chat wird der mitgelieferte lokale PHP-Server verwendet.

## Schnellstart

### Nur Desktop-Oberfläche

**index.html** doppelklicken.

Dabei funktionieren unter anderem:

- Desktop, Startmenü, Suche und Taskleiste
- verschiebbare Desktop-Symbole mit gespeicherten Positionen
- verschiebbare, minimierbare, maximierbare, skalierbare und schließbare Fenster
- Explorer, virtuelle Dateien und Ordner
- Drag-and-drop in den Papierkorb
- Wiederherstellen, endgültiges Löschen und PAPIERKORB LEEREN
- Import lokaler Bilder/Videos sowie Einbettung direkter Medien- und YouTube-Links
- Games- und Webseitenlink-Verwaltung
- bearbeitbares Patrick-Profil mit Name, Profilbild, Titelbild und Kontaktdaten
- JSON-Export und -Import der lokalen Konfiguration
- lokaler Chat-Demomodus

### Vollständiger Chat mit PHP und SQLite

Voraussetzungen:

- Windows 11
- PHP 8.1 oder neuer
- aktivierte Erweiterungen PDO und pdo_sqlite
- ein moderner Browser

Vorgehen:

1. PHP installieren, falls **php -v** in einer Eingabeaufforderung noch nicht funktioniert. Möglich sind die offizielle Windows-PHP-Version oder ein lokales Paket wie XAMPP.
2. Prüfen: **php -m** muss PDO und pdo_sqlite anzeigen.
3. **scripts/start-server.bat** doppelklicken.
4. Im Browser **http://127.0.0.1:8000** öffnen.
5. Raum-Chat öffnen und ein Konto registrieren.

Beim ersten Start wird **data/desktop.sqlite** automatisch aus **database/schema.sql** erstellt. Ein manueller SQL-Import ist bei SQLite nicht erforderlich.

Alternativ in einer Eingabeaufforderung im Projektordner:

~~~text
php -S 127.0.0.1:8000 router.php
~~~

Anschließend **http://127.0.0.1:8000** öffnen. Den Server mit Strg+C beenden.

## Projektstruktur

~~~text
Desktop-Webseite/
|- index.html                 zentrale Desktop-Startseite
|- router.php                 sicherer Router für den PHP-Entwicklungsserver
|- manifest.webmanifest       installierbare Web-App
|- service-worker.js          Offline-Cache
|- assets/
|  |- css/windows11.css       gemeinsames Windows-11-Dark-Theme
|  |- js/app.js               Desktop, Fenster, Dateisystem und Apps
|  |- images/                 originales Hintergrundbild
|  +- icons/                  App-Symbol
|- api/
|  |- index.php               Anmeldung, Räume, Nachrichten und Moderation
|  |- local-games.php         lesender Steam-/Xbox-Bibliotheksscan
|  +- upload.php              sicher geprüfter Medien-Upload
|- config/
|  |- database.php            SQLite-Verbindung und automatische Einrichtung
|  +- config.example.php      Beispiel für Produktionswerte
|- database/
|  +- schema.sql              vollständige relationale Datenbankstruktur
|- data/                      lokale SQLite-Datenbank, nicht öffentlich
|- uploads/                   geprüfte Server-Uploads
|- pages/                     Erläuterung der dynamischen Fensterseiten
|- scripts/
|  +- start-server.bat        lokaler Ein-Klick-Start
|- INSTALLATION.md            kurze Installationsanleitung
+- SECURITY.md                Sicherheits- und Produktionshinweise
~~~

## Bedienung

### Desktop und Fenster

- Ein Symbol einmal anklicken, um es auszuwählen.
- Doppelklick öffnet die zugehörige App.
- Symbole mit gedrückter Maustaste frei verschieben. Positionen werden automatisch gespeichert.
- Ein Symbol auf den Papierkorb ziehen, um die Verknüpfung zu entfernen.
- Rechtsklick auf Desktop, Symbol oder Datei öffnet das passende Kontextmenü.
- Fenster an der Titelleiste bewegen.
- Die Schaltflächen rechts oben minimieren, maximieren oder schließen.
- Fenster können am rechten unteren Rand in der Größe verändert werden.
- Geöffnete Apps sind in der Taskleiste markiert.

### Startmenü und Taskleiste

- Das Windows-Symbol öffnet das Startmenü.
- Die Suche filtert Apps und zuletzt verwendete Inhalte.
- Angeheftete Apps erscheinen in einem Raster.
- Der Benutzerbereich unten öffnet das Profil.
- Uhrzeit und Datum werden automatisch im deutschen Format aktualisiert.
- Der Pfeil rechts öffnet das Drop-up-Menü mit Webseitenverlinkungen.
- Lautstärke, Ethernet, Bluetooth, Phone Link, Discord und Steam sind bewusst nicht im rechten Taskleistenbereich enthalten.

### Virtuelles Dateisystem und Papierkorb

Im Explorer lassen sich Ordner und Textdateien dynamisch erstellen. Dateien können ausgewählt, kopiert, umbenannt, geöffnet, verschoben und in den Papierkorb gelegt werden. Der Zustand wird nicht fest im HTML gespeichert, sondern im Browser-Speicher verwaltet.

Zurück, Vorwärts und Aktualisieren funktionieren übergreifend zwischen Desktop, Unterordnern, Bilder & Videos, Games und Papierkorb.

Der Papierkorb unterstützt Dateien, Ordner, Medienreferenzen, Games und Desktop-Verknüpfungen. Einzelne Elemente können wiederhergestellt oder endgültig gelöscht werden. Vollständiges Leeren besitzt eine Sicherheitsabfrage. Das Symbol unterscheidet leeren und gefüllten Zustand. Optional ist automatisches Leeren nach 7 oder 30 Tagen möglich.

### Bilder und Videos

Bilder & Videos öffnen und Importieren wählen. Unterstützt werden:

- Bilder und Videos aus dem Windows-Dateidialog
- Vorschaubilder
- Bildanzeige und Videowiedergabe
- Vollbild
- Galerie- und Listenansicht
- Suche und Sortierung
- Dateiname, Typ, Größe und Änderungsdatum
- Umbenennen und Verschieben in den Papierkorb

Aus Sicherheitsgründen liest eine Webseite den Windows-Bilder- oder Videos-Ordner nie heimlich aus. Dateien werden erst nach einer ausdrücklichen Auswahl importiert.

Dateien bis 3,5 MB können dauerhaft im Browser-Speicher verbleiben. Größere Dateien werden nur für die aktuelle Sitzung als lokaler Objekt-Link gehalten und müssen nach einem Neuladen erneut ausgewählt werden. Für dauerhafte große Medien steht mit angemeldetem Konto außerdem **api/upload.php** bereit; die Upload-Grenze beträgt standardmäßig 20 MB.

### Games

Im Games-Fenster werden beim Betrieb über **scripts/start-server.bat** automatisch die installierten Einträge aus **C:\XboxGames** und **C:\Program Files (x86)\Steam\steamapps\common** angezeigt. Steam-Manifeste liefern Name, Größe, letzte Verwendung und einen `steam://`-Startlink. Verzeichnisse ohne Manifest und Xbox-Installationen bleiben mit ihrem Installationspfad sichtbar. Der Scan ist fest auf diese beiden Quellen begrenzt und verändert keine lokalen Spiele oder Dateien.

Zusätzlich können eigene Einträge hinzugefügt, bearbeitet und entfernt werden. Eine normale Webseite darf lokale EXE-Dateien nicht beliebig starten. Automatisch erkannte Steam-Spiele verwenden deshalb das registrierte Steam-Protokoll; bei anderen Installationen zeigt die Oberfläche den lokalen Pfad an.

### Einstellungen und Profil

Die Einstellungen enthalten System, Personalisierung, Hintergrund, Farben, Dark Mode, Desktop-Symbole, Taskleiste, Startmenü, Profil, Webseitenlinks, Games, Medien, Chat, Speicher, Papierkorb, Datenschutz, Datenbank sowie Import und Export.

Alle Änderungen werden automatisch gespeichert. Ausgewählte Desktop-Hintergründe werden für die Bildschirmgröße optimiert und sofort als Hintergrund übernommen. Im Benutzerprofil lassen sich Profilbild und Titelbild getrennt auswählen oder wieder entfernen; beide Bilder bleiben lokal im Browser gespeichert. Über Import & Export kann eine JSON-Sicherung erstellt und wieder eingelesen werden.

### Raum-Chat

Der Chat besitzt zwei Betriebsarten:

- Offline-Demo: funktioniert direkt über index.html in einem Browser.
- PHP/SQLite-Mehrbenutzerbetrieb: Registrierung, Anmeldung, Sitzungen, Räume und Nachrichten werden serverseitig gespeichert.

Umgesetzt sind:

- Registrierung, Anmeldung und Abmeldung
- sichere Passwort-Hashes
- mehrere öffentliche Chaträume und Raumwechsel
- Raum- und Online-Benutzerliste
- öffentliche Nachrichten über AJAX-Polling
- Zeitstempel, Emojis sowie Fett- und Kursivformatierung
- Rollen für Mitglieder, Moderatoren und Administratoren
- private Nachrichten und Systemnachrichten
- Befehle /help, /go Raum, /msg Nick Text, /me Text und /clear
- Meldefunktion
- Spam- und Wiederholungsschutz
- Verwarnen, Stummschalten, Entfernen und Sperren über die Moderations-API
- moderatives Löschen von Nachrichten
- Moderations- und Meldetabellen

Rechtsklick auf ein Mitglied öffnet private Nachrichten. Moderatoren und Administratoren erhalten dort zusätzlich Moderationsaktionen. Rechtsklick auf eine Nachricht ermöglicht eine Meldung; Moderatoren können sie ausblenden.

Das Frontend fragt neue Nachrichten etwa alle 2,2 Sekunden per Fetch API ab. Das ist eine robuste Alternative zu WebSockets und funktioniert auch mit einem einfachen PHP-Server.

## Chat-Entwurfsgrundlage

Es wurden nur öffentlich nachvollziehbare Interaktionsmuster übernommen und keine Logos, Markenassets oder nicht öffentlichen Quellcodes von Knuddels kopiert. Die offizielle Hilfe beschreibt unter anderem öffentliche und private MyChannels, getrennte Rollen/Status, Channelmoderation, private Unterhaltungen, Kontakt- und Spamfilter sowie Meldungen:

- [MyChannel - Allgemeine Informationen](https://hilfe.knuddels.de/de/articles/3946291-mychannel-allgemeine-informationen)
- [Status und Rollen von Accounts](https://hilfe.knuddels.de/de/articles/11121362-status-und-rollen-von-accounts)
- [MyChannel - Moderationsrichtlinien](https://hilfe.knuddels.de/de/articles/9920287-mychannel-moderationsrichtlinien)
- [Der Knuddels Messenger - Alle Funktionen](https://hilfe.knuddels.de/de/articles/15458815-der-knuddels-messenger-alle-funktionen-auf-einen-blick)
- [Kontaktfilter und Spamfilter](https://hilfe.knuddels.de/de/articles/4618715-was-ist-der-kontaktfilter)

Diese Web-App ist eine eigenständige Raum-Chat-Lösung im Design des Desktop-Projekts und kein Knuddels-Produkt.

## Datenbank

**database/schema.sql** enthält Tabellen für Benutzer, Profile, Einstellungen, Sessions, Desktop-Symbole, Dateien, Ordner, Papierkorb, Games, Medien, Webseitenlinks, Chat-Räume, Chat-Mitglieder, Nachrichten, private Nachrichten, Rollen, Berechtigungen, Moderationsmaßnahmen, Meldungen und Benachrichtigungen.

Das Backend verwendet PDO mit vorbereiteten Abfragen. Zugangsdaten stehen nicht im JavaScript. SQLite benötigt für den lokalen Betrieb keinen Benutzernamen und kein Passwort.

## Sicherheit

- Passwörter werden mit password_hash() gespeichert und mit password_verify() geprüft.
- Sitzungs-Cookies sind HttpOnly und SameSite=Strict; bei HTTPS zusätzlich Secure.
- Zustandsändernde API-Aufrufe benötigen ein CSRF-Token.
- Eingaben werden validiert, begrenzt und parametrisiert gespeichert.
- Das Frontend schreibt Nachrichten mit HTML-Escaping in die Oberfläche.
- Chat und Anmeldung besitzen Ratenbegrenzungen.
- Uploads werden über echten MIME-Typ, Größe und zufälligen Dateinamen geprüft.
- ausführbare Upload-Dateitypen sind blockiert.
- router.php verhindert den Webzugriff auf Konfiguration, Datenbank, Datendatei und Skripte.

Für einen öffentlich erreichbaren Server zusätzlich **SECURITY.md** beachten.

## Lokale Dateien und Programme

Der Desktop bindet keine privaten Dateien ungefragt ein. Die unterstützten Wege sind:

1. Medien über den Windows-Dateidialog importieren.
2. Games über das Verwaltungsformular eintragen.
3. Webseitenlinks über Einstellungen pflegen.
4. Konfiguration als JSON sichern oder importieren.
5. Medien mit angemeldetem Benutzer über den geprüften PHP-Upload speichern.

Damit bleibt die Browser-Sicherheitsgrenze erhalten und die echte Ordnerstruktur kann später kontrolliert ergänzt werden.

## Typische Probleme

### php wurde nicht gefunden

PHP installieren und danach ein neues Terminal öffnen. php -v muss eine Versionsnummer zeigen. Bei XAMPP kann alternativ der vollständige Pfad zu php.exe verwendet oder dessen Ordner zur Windows-Umgebungsvariable PATH hinzugefügt werden.

### could not find driver

pdo_sqlite ist nicht aktiv. In php.ini die SQLite-PDO-Erweiterung aktivieren und den Server neu starten. Anschließend mit php -m prüfen.

### Port 8000 ist belegt

~~~text
php -S 127.0.0.1:8080 router.php
~~~

Danach **http://127.0.0.1:8080** öffnen.

### Chat bleibt im Offline-Modus

Nicht index.html per file:// öffnen, sondern die Adresse des PHP-Servers verwenden. Im Browser muss api/index.php?action=session eine JSON-Antwort liefern.

### Große Medien fehlen nach dem Neuladen

Das ist der vorgesehene Datenschutz- und Speichermechanismus des Browser-Imports. Datei erneut importieren oder den authentifizierten PHP-Upload verwenden.

### Änderungen erscheinen nach einem Update nicht

Einmal hart neu laden (Strg+F5) oder den Website-Cache löschen. Der Service Worker aktualisiert sich anschließend.

### Datenbank zurücksetzen

Server beenden, data/desktop.sqlite löschen und neu starten. Das Schema wird automatisch neu erstellt. Vorher bei Bedarf die Datei sichern.

## Responsive und barrierearme Bedienung

Auf kleinen Bildschirmen maximieren Fenster automatisch, Seitenleisten werden kompakter und die Taskleiste blendet weniger wichtige Symbole aus. Wichtige Schaltflächen besitzen sichtbare Fokusrahmen und Beschriftungen. Esc, Enter, Entf, Strg+A, Doppelklick und Kontextmenüs werden unterstützt. Bewegungen respektieren prefers-reduced-motion.

## Produktionsbetrieb

Der eingebaute PHP-Server ist für lokale Nutzung und Entwicklung gedacht. Für öffentlichen Betrieb HTTPS und einen produktiven Webserver verwenden, data außerhalb des Webroots ablegen, Uploads separat speichern, Backups und Aufbewahrungsfristen einrichten, E-Mail-Verifizierung ergänzen, Sicherheitsheader konfigurieren sowie Datenschutztext, Impressum und Community-Regeln bereitstellen.

Weitere Hinweise stehen in **SECURITY.md**.
