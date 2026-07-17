<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo '{"ok":false,"error":"Nur GET ist erlaubt."}';
    exit;
}

/**
 * Liest ausschließlich die fest eingetragenen lokalen Spielebibliotheken.
 * Es gibt bewusst keinen Pfad-Parameter, damit dieser Endpunkt nicht als
 * allgemeiner Dateibrowser verwendet werden kann.
 */
$xboxRoot = 'C:\\XboxGames';
$steamAppsRoot = 'C:\\Program Files (x86)\\Steam\\steamapps';
$steamCommonRoot = $steamAppsRoot . '\\common';
$games = [];
$roots = [];

function localGameId(string $source, string $path): string
{
    return 'local-' . substr(hash('sha256', $source . '|' . strtolower($path)), 0, 16);
}

function acfValue(string $content, string $key): string
{
    $pattern = '/"' . preg_quote($key, '/') . '"\\s+"([^"]*)"/i';
    if (!preg_match($pattern, $content, $match)) {
        return '';
    }
    return str_replace('\\\\', '\\', $match[1]);
}

function directoryNames(string $root): array
{
    if (!is_dir($root) || !is_readable($root)) {
        return [];
    }
    $names = [];
    try {
        $iterator = new FilesystemIterator($root, FilesystemIterator::SKIP_DOTS);
        foreach ($iterator as $entry) {
            if ($entry->isDir() && !$entry->isLink()) {
                $names[] = $entry->getFilename();
            }
        }
    } catch (UnexpectedValueException $exception) {
        return [];
    }
    natcasesort($names);
    return array_values($names);
}

$xboxAvailable = is_dir($xboxRoot) && is_readable($xboxRoot);
$xboxCount = 0;
$xboxIgnored = ['gamesave', 'wpsystem', 'windowsapps', 'mutablebackup', 'program files'];
foreach (directoryNames($xboxRoot) as $directory) {
    if (in_array(strtolower($directory), $xboxIgnored, true)) {
        continue;
    }
    $path = $xboxRoot . '\\' . $directory;
    $games[] = [
        'id' => localGameId('xbox', $path),
        'name' => $directory,
        'path' => $path,
        'url' => '',
        'source' => 'xbox',
        'icon' => '🟩',
        'size' => 'Xbox-Installation',
        'lastUsed' => '',
    ];
    $xboxCount++;
}
$roots[] = ['label' => 'Xbox', 'path' => $xboxRoot, 'available' => $xboxAvailable, 'count' => $xboxCount];

$steamAvailable = is_dir($steamCommonRoot) && is_readable($steamCommonRoot);
$steamCount = 0;
$steamDirectories = [];
$manifestFiles = glob($steamAppsRoot . '\\appmanifest_*.acf') ?: [];
foreach ($manifestFiles as $manifestFile) {
    if (!is_file($manifestFile) || !is_readable($manifestFile)) {
        continue;
    }
    $content = file_get_contents($manifestFile);
    if ($content === false) {
        continue;
    }
    $appId = acfValue($content, 'appid');
    $name = acfValue($content, 'name');
    $installDir = acfValue($content, 'installdir');
    if ($appId === '' || $name === '' || $installDir === '') {
        continue;
    }
    $path = $steamCommonRoot . '\\' . $installDir;
    if (!is_dir($path)) {
        continue;
    }
    $steamDirectories[strtolower($installDir)] = true;
    $sizeOnDisk = (int) acfValue($content, 'SizeOnDisk');
    $lastPlayed = (int) acfValue($content, 'LastPlayed');
    $games[] = [
        'id' => 'steam-' . preg_replace('/[^0-9]/', '', $appId),
        'name' => $name,
        'path' => $path,
        'url' => 'steam://rungameid/' . preg_replace('/[^0-9]/', '', $appId),
        'source' => 'steam',
        'icon' => '🎮',
        'size' => $sizeOnDisk,
        'lastUsed' => $lastPlayed > 0 ? gmdate('c', $lastPlayed) : '',
    ];
    $steamCount++;
}

// Verzeichnisse ohne Manifest bleiben sichtbar, zum Beispiel verschobene
// Installationen. Sie erhalten nur keinen automatischen Steam-Startlink.
foreach (directoryNames($steamCommonRoot) as $directory) {
    if (isset($steamDirectories[strtolower($directory)])) {
        continue;
    }
    $path = $steamCommonRoot . '\\' . $directory;
    $games[] = [
        'id' => localGameId('steam', $path),
        'name' => $directory,
        'path' => $path,
        'url' => '',
        'source' => 'steam',
        'icon' => '🎮',
        'size' => 'Steam-Ordner',
        'lastUsed' => '',
    ];
    $steamCount++;
}
$roots[] = ['label' => 'Steam', 'path' => $steamCommonRoot, 'available' => $steamAvailable, 'count' => $steamCount];

usort($games, static function (array $left, array $right): int {
    return strnatcasecmp((string) $left['name'], (string) $right['name']);
});

echo json_encode([
    'ok' => true,
    'games' => $games,
    'roots' => $roots,
    'scannedAt' => gmdate('c'),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
