<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

session_name('MATZE_DESKTOP_SESSION');
session_start();

function uploadResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    uploadResponse(['ok' => false, 'error' => 'Nur POST ist erlaubt.'], 405);
}

if (!isset($_SESSION['user_id'])) {
    uploadResponse(['ok' => false, 'error' => 'Bitte zuerst anmelden.'], 401);
}

$csrf = (string) ($_POST['csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
if ($csrf === '' || !hash_equals((string) ($_SESSION['csrf'] ?? ''), $csrf)) {
    uploadResponse(['ok' => false, 'error' => 'Ungültige Sicherheitsprüfung.'], 419);
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    uploadResponse(['ok' => false, 'error' => 'Es wurde keine Datei übertragen.'], 422);
}

$upload = $_FILES['file'];
if ((int) $upload['error'] !== UPLOAD_ERR_OK) {
    uploadResponse(['ok' => false, 'error' => 'Der Upload ist fehlgeschlagen.'], 422);
}

$purpose = (string) ($_POST['purpose'] ?? 'media');
if (!in_array($purpose, ['media', 'chat-avatar'], true)) {
    uploadResponse(['ok' => false, 'error' => 'Unbekannter Upload-Zweck.'], 422);
}

$maxBytes = $purpose === 'chat-avatar' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
if ((int) $upload['size'] <= 0 || (int) $upload['size'] > $maxBytes) {
    uploadResponse(['ok' => false, 'error' => 'Die Datei darf höchstens ' . ($maxBytes / 1024 / 1024) . ' MB groß sein.'], 413);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string) $finfo->file((string) $upload['tmp_name']);
$allowed = [
    'image/jpeg' => ['image', 'jpg'],
    'image/png' => ['image', 'png'],
    'image/gif' => ['image', 'gif'],
    'image/webp' => ['image', 'webp'],
    'video/mp4' => ['video', 'mp4'],
    'video/webm' => ['video', 'webm'],
];

if (!isset($allowed[$mime])) {
    uploadResponse(['ok' => false, 'error' => 'Dieser Dateityp ist nicht erlaubt.'], 415);
}

[$mediaType, $extension] = $allowed[$mime];
if ($purpose === 'chat-avatar' && $mediaType !== 'image') {
    uploadResponse(['ok' => false, 'error' => 'Als Profilbild sind nur Bilder erlaubt.'], 415);
}

$relativeDirectory = $purpose === 'chat-avatar' ? 'uploads/avatars' : 'uploads';
$uploadDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativeDirectory);
if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0770, true) && !is_dir($uploadDirectory)) {
    uploadResponse(['ok' => false, 'error' => 'Der Upload-Ordner ist nicht beschreibbar.'], 500);
}

$storedName = bin2hex(random_bytes(20)) . '.' . $extension;
$destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;
if (!move_uploaded_file((string) $upload['tmp_name'], $destination)) {
    uploadResponse(['ok' => false, 'error' => 'Die Datei konnte nicht sicher gespeichert werden.'], 500);
}

$originalName = trim(basename((string) $upload['name']));
$originalName = preg_replace('/[\x00-\x1F\x7F]/u', '', $originalName) ?: ('Upload.' . $extension);

$db = database();
if ($purpose === 'chat-avatar') {
    $avatarPath = $relativeDirectory . '/' . $storedName;
    $statement = $db->prepare(
        'INSERT INTO user_profiles (user_id, avatar_path, online_status)
         VALUES (:user_id, :avatar_path, "online")
         ON CONFLICT(user_id) DO UPDATE SET avatar_path = excluded.avatar_path'
    );
    $statement->execute([
        'user_id' => (int) $_SESSION['user_id'],
        'avatar_path' => $avatarPath,
    ]);
    uploadResponse(['ok' => true, 'avatar_path' => $avatarPath], 201);
}

$statement = $db->prepare(
    'INSERT INTO media (user_id, media_type, name, mime_type, storage_path, size_bytes)
     VALUES (:user_id, :media_type, :name, :mime_type, :storage_path, :size_bytes)'
);
$statement->execute([
    'user_id' => (int) $_SESSION['user_id'],
    'media_type' => $mediaType,
    'name' => $originalName,
    'mime_type' => $mime,
    'storage_path' => 'uploads/' . $storedName,
    'size_bytes' => (int) $upload['size'],
]);

uploadResponse([
    'ok' => true,
    'media' => [
        'id' => (int) $db->lastInsertId(),
        'name' => $originalName,
        'type' => $mediaType,
        'mime' => $mime,
        'size' => (int) $upload['size'],
        'src' => 'uploads/' . $storedName,
    ],
], 201);
