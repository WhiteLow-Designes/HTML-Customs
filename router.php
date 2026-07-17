<?php
declare(strict_types=1);

/**
 * Router für den eingebauten PHP-Entwicklungsserver.
 * Schützt Konfiguration, Datenbank, Skripte und Dokumentationsquellen.
 */
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$blockedPrefixes = ['/config/', '/database/', '/data/', '/scripts/'];

foreach ($blockedPrefixes as $prefix) {
    if (str_starts_with($uriPath, $prefix)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Nicht gefunden';
        return true;
    }
}

$path = __DIR__ . str_replace('/', DIRECTORY_SEPARATOR, rawurldecode($uriPath));
if ($uriPath !== '/' && is_file($path)) {
    header('Cache-Control: no-cache, must-revalidate, max-age=0');
    return false;
}

if (str_starts_with($uriPath, '/api/')) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo '{"ok":false,"error":"API-Endpunkt nicht gefunden."}';
    return true;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
readfile(__DIR__ . '/index.html');
return true;
