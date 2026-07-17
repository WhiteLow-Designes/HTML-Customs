# Sicherheitshinweise

Die Standardkonfiguration ist für einen lokalen Rechner vorgesehen.

## Bereits umgesetzt

- Passwort-Hashing mit PHPs aktuellem Standardalgorithmus
- parametrisierte PDO-Abfragen
- CSRF-Token
- sichere Sitzungs-Cookie-Attribute
- Eingabevalidierung und serverseitige Längenbegrenzungen
- HTML-Escaping im Frontend
- Ratenbegrenzung für Anmeldung, Registrierung und Nachrichten
- Spam-Wiederholungsschutz
- MIME- und Größenprüfung bei Uploads
- zufällige Upload-Dateinamen
- Sperre ausführbarer Uploadtypen
- geschützter Zugriff auf config, database, data und scripts
- protokollierte Moderationsmaßnahmen und Meldungen

## Vor öffentlicher Bereitstellung erforderlich

1. HTTPS erzwingen.
2. data außerhalb des Webroots speichern und den Pfad in config/database.php anpassen.
3. Uploads außerhalb des Webroots speichern oder über einen kontrollierten Download-Endpunkt ausliefern.
4. Webserver-Regeln unabhängig von .htaccess prüfen.
5. Content Security Policy, HSTS und weitere Sicherheitsheader konfigurieren.
6. Kontosperren, E-Mail-Verifizierung, Passwort-Zurücksetzen und Schutz gegen automatisierte Registrierung ergänzen.
7. Protokolle, Backups, Löschfristen und Datenschutzinformationen festlegen.
8. Administratorrollen nie über eine öffentliche Oberfläche vergeben.
9. PHP und alle Serverkomponenten regelmäßig aktualisieren.

Verdächtige Fehlerdetails werden absichtlich nur in das PHP-Fehlerprotokoll geschrieben und nicht an den Browser gesendet.

