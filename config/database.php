<?php
declare(strict_types=1);

/**
 * SQLite-Verbindung für die lokale Desktop-Webseite.
 *
 * Für eine produktive Bereitstellung sollte der data-Ordner außerhalb des
 * öffentlich erreichbaren Webroots liegen. Siehe README.md.
 */
function database(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dataDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0770, true) && !is_dir($dataDirectory)) {
        throw new RuntimeException('Der Datenordner konnte nicht erstellt werden.');
    }

    $databasePath = $dataDirectory . DIRECTORY_SEPARATOR . 'desktop.sqlite';
    $firstStart = !is_file($databasePath);

    $pdo = new PDO('sqlite:' . $databasePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');

    if ($firstStart) {
        $schema = file_get_contents(dirname(__DIR__) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql');
        if ($schema === false) {
            throw new RuntimeException('Die Datenbankstruktur wurde nicht gefunden.');
        }
        $pdo->exec($schema);
    }

    return $pdo;
}

