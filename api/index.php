<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_name('MATZE_DESKTOP_SESSION');
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

if (!isset($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

try {
    $db = database();
    $action = isset($_GET['action']) ? (string) $_GET['action'] : 'session';
    $input = readInput();

    if (isset($_SESSION['user_id'])) {
        $touch = $db->prepare('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = :id');
        $touch->execute(['id' => (int) $_SESSION['user_id']]);
    }

    switch ($action) {
        case 'session':
            requireMethod('GET');
            respond([
                'ok' => true,
                'user' => currentUser($db),
                'csrf' => $_SESSION['csrf'],
                'rooms' => roomList($db),
            ]);
            break;

        case 'register':
            requireMethod('POST');
            rateLimit('register', 2.0);
            $username = trim((string) ($input['username'] ?? ''));
            $email = trim((string) ($input['email'] ?? ''));
            $password = (string) ($input['password'] ?? '');

            if (!preg_match('/^[\p{L}\p{N}_\- ]{3,24}$/u', $username)) {
                apiError('Der Nickname muss 3 bis 24 Buchstaben, Zahlen, Leerzeichen, _ oder - enthalten.', 422);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
                apiError('Bitte gib eine gültige E-Mail-Adresse ein.', 422);
            }
            if (strlen($password) < 8 || strlen($password) > 200) {
                apiError('Das Passwort muss mindestens 8 Zeichen lang sein.', 422);
            }

            try {
                $db->beginTransaction();
                $statement = $db->prepare(
                    'INSERT INTO users (username, email, password_hash, role_id, last_seen_at)
                     VALUES (:username, :email, :password_hash, 1, CURRENT_TIMESTAMP)'
                );
                $statement->execute([
                    'username' => $username,
                    'email' => $email,
                    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                ]);
                $userId = (int) $db->lastInsertId();
                $profile = $db->prepare('INSERT INTO user_profiles (user_id, online_status) VALUES (:id, :status)');
                $profile->execute(['id' => $userId, 'status' => 'online']);
                $db->commit();
            } catch (PDOException $exception) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                if ((int) $exception->getCode() === 23000 || strpos($exception->getMessage(), 'UNIQUE') !== false) {
                    apiError('Nickname oder E-Mail-Adresse wird bereits verwendet.', 409);
                }
                throw $exception;
            }

            authenticateSession($userId);
            respond(['ok' => true, 'user' => currentUser($db), 'csrf' => $_SESSION['csrf']], 201);
            break;

        case 'login':
            requireMethod('POST');
            rateLimit('login', 1.0);
            $username = trim((string) ($input['username'] ?? ''));
            $password = (string) ($input['password'] ?? '');
            $statement = $db->prepare(
                'SELECT u.id, u.password_hash, u.status
                 FROM users u
                 WHERE u.username = :identity OR u.email = :identity
                 LIMIT 1'
            );
            $statement->execute(['identity' => $username]);
            $row = $statement->fetch();
            if (!$row || !password_verify($password, (string) $row['password_hash'])) {
                usleep(250000);
                apiError('Nickname/E-Mail oder Passwort ist falsch.', 401);
            }
            if ($row['status'] === 'banned' || $row['status'] === 'suspended') {
                apiError('Dieses Konto ist derzeit gesperrt.', 403);
            }
            authenticateSession((int) $row['id']);
            respond(['ok' => true, 'user' => currentUser($db), 'csrf' => $_SESSION['csrf']]);
            break;

        case 'logout':
            requireMethod('POST');
            requireCsrf($input);
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
            }
            session_destroy();
            respond(['ok' => true]);
            break;

        case 'messages':
            requireMethod('GET');
            $roomId = positiveInt($_GET['room_id'] ?? 1);
            $since = max(0, (int) ($_GET['since'] ?? 0));
            assertRoomExists($db, $roomId);
            $statement = $db->prepare(
                'SELECT m.id, m.room_id, m.message_type AS type, m.body, m.created_at,
                        COALESCE(u.username, "System") AS username,
                        COALESCE(r.name, "system") AS role,
                        p.avatar_path
                 FROM chat_messages m
                 LEFT JOIN users u ON u.id = m.user_id
                 LEFT JOIN roles r ON r.id = u.role_id
                 LEFT JOIN user_profiles p ON p.user_id = u.id
                 WHERE m.room_id = :room_id AND m.id > :since AND m.deleted_at IS NULL
                 ORDER BY m.id ASC
                 LIMIT 200'
            );
            $statement->bindValue(':room_id', $roomId, PDO::PARAM_INT);
            $statement->bindValue(':since', $since, PDO::PARAM_INT);
            $statement->execute();
            respond([
                'ok' => true,
                'messages' => $statement->fetchAll(),
                'users' => onlineUsers($db),
                'rooms' => roomList($db),
            ]);
            break;

        case 'send':
            requireMethod('POST');
            $user = requireUser($db);
            requireCsrf($input);
            rateLimit('send', 0.8);
            if ($user['status'] !== 'active') {
                apiError('Du kannst aktuell keine öffentlichen Nachrichten senden.', 403);
            }
            $roomId = positiveInt($input['room_id'] ?? 0);
            assertRoomExists($db, $roomId);
            $body = normalizeMessage((string) ($input['body'] ?? ''));
            if ($body === '') {
                apiError('Die Nachricht ist leer.', 422);
            }
            if (textLength($body) > 1000) {
                apiError('Die Nachricht darf höchstens 1000 Zeichen enthalten.', 422);
            }
            rejectSpam($body);
            $statement = $db->prepare(
                'INSERT INTO chat_messages (room_id, user_id, message_type, body)
                 VALUES (:room_id, :user_id, :type, :body)'
            );
            $statement->execute([
                'room_id' => $roomId,
                'user_id' => (int) $user['id'],
                'type' => 'message',
                'body' => $body,
            ]);
            $membership = $db->prepare(
                'INSERT OR IGNORE INTO chat_room_members (room_id, user_id) VALUES (:room_id, :user_id)'
            );
            $membership->execute(['room_id' => $roomId, 'user_id' => (int) $user['id']]);
            respond(['ok' => true, 'message_id' => (int) $db->lastInsertId()], 201);
            break;

        case 'private_send':
            requireMethod('POST');
            $user = requireUser($db);
            requireCsrf($input);
            rateLimit('private_send', 1.0);
            $recipientName = trim((string) ($input['recipient'] ?? ''));
            $body = normalizeMessage((string) ($input['body'] ?? ''));
            if ($body === '' || textLength($body) > 1000) {
                apiError('Private Nachrichten müssen 1 bis 1000 Zeichen enthalten.', 422);
            }
            $recipientStatement = $db->prepare('SELECT id FROM users WHERE username = :username AND status != "banned" LIMIT 1');
            $recipientStatement->execute(['username' => $recipientName]);
            $recipientId = (int) ($recipientStatement->fetchColumn() ?: 0);
            if (!$recipientId) {
                apiError('Dieses Mitglied wurde nicht gefunden.', 404);
            }
            if ($recipientId === (int) $user['id']) {
                apiError('Du kannst dir nicht selbst schreiben.', 422);
            }
            rejectSpam($body);
            $statement = $db->prepare(
                'INSERT INTO private_messages (sender_user_id, recipient_user_id, body)
                 VALUES (:sender, :recipient, :body)'
            );
            $statement->execute(['sender' => (int) $user['id'], 'recipient' => $recipientId, 'body' => $body]);
            respond(['ok' => true, 'message_id' => (int) $db->lastInsertId()], 201);
            break;

        case 'report':
            requireMethod('POST');
            $user = requireUser($db);
            requireCsrf($input);
            rateLimit('report', 5.0);
            $messageId = positiveInt($input['message_id'] ?? 0);
            $reason = trim((string) ($input['reason'] ?? ''));
            if (textLength($reason) < 5 || textLength($reason) > 500) {
                apiError('Bitte beschreibe den Meldegrund in 5 bis 500 Zeichen.', 422);
            }
            $target = $db->prepare('SELECT user_id FROM chat_messages WHERE id = :id');
            $target->execute(['id' => $messageId]);
            $targetUserId = (int) ($target->fetchColumn() ?: 0);
            if (!$targetUserId) {
                apiError('Die gemeldete Nachricht wurde nicht gefunden.', 404);
            }
            $statement = $db->prepare(
                'INSERT INTO reports (reporter_user_id, reported_user_id, message_id, reason)
                 VALUES (:reporter, :reported, :message, :reason)'
            );
            $statement->execute([
                'reporter' => (int) $user['id'],
                'reported' => $targetUserId,
                'message' => $messageId,
                'reason' => $reason,
            ]);
            respond(['ok' => true, 'report_id' => (int) $db->lastInsertId()], 201);
            break;

        case 'moderate':
            requireMethod('POST');
            $moderator = requireModerator($db);
            requireCsrf($input);
            rateLimit('moderate', 1.0);
            $targetId = positiveInt($input['target_user_id'] ?? 0);
            $roomId = isset($input['room_id']) ? positiveInt($input['room_id']) : null;
            $moderationAction = (string) ($input['moderation_action'] ?? '');
            $allowedActions = ['warn', 'mute', 'kick', 'suspend', 'ban'];
            if (!in_array($moderationAction, $allowedActions, true)) {
                apiError('Unbekannte Moderationsaktion.', 422);
            }
            if ($targetId === (int) $moderator['id']) {
                apiError('Du kannst dich nicht selbst moderieren.', 422);
            }
            $reason = trim((string) ($input['reason'] ?? 'Kein Grund angegeben'));
            $expiresAt = isset($input['expires_at']) ? (string) $input['expires_at'] : null;
            $statement = $db->prepare(
                'INSERT INTO moderation_actions
                 (moderator_user_id, target_user_id, room_id, action_type, reason, expires_at)
                 VALUES (:moderator, :target, :room, :action, :reason, :expires)'
            );
            $statement->execute([
                'moderator' => (int) $moderator['id'],
                'target' => $targetId,
                'room' => $roomId,
                'action' => $moderationAction,
                'reason' => $reason,
                'expires' => $expiresAt,
            ]);
            if ($moderationAction === 'mute' || $moderationAction === 'suspend' || $moderationAction === 'ban') {
                $status = $moderationAction === 'mute' ? 'muted' : ($moderationAction === 'ban' ? 'banned' : 'suspended');
                $update = $db->prepare('UPDATE users SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
                $update->execute(['status' => $status, 'id' => $targetId]);
            }
            respond(['ok' => true, 'action_id' => (int) $db->lastInsertId()], 201);
            break;

        case 'delete_message':
            requireMethod('POST');
            $moderator = requireModerator($db);
            requireCsrf($input);
            rateLimit('delete_message', 0.5);
            $messageId = positiveInt($input['message_id'] ?? 0);
            $roomId = positiveInt($input['room_id'] ?? 0);
            $target = $db->prepare('SELECT user_id FROM chat_messages WHERE id = :id AND room_id = :room_id AND deleted_at IS NULL');
            $target->execute(['id' => $messageId, 'room_id' => $roomId]);
            $targetUserId = (int) ($target->fetchColumn() ?: 0);
            if (!$targetUserId) {
                apiError('Die Nachricht wurde nicht gefunden oder ist bereits gelöscht.', 404);
            }
            $db->beginTransaction();
            $delete = $db->prepare('UPDATE chat_messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id');
            $delete->execute(['id' => $messageId]);
            $log = $db->prepare(
                'INSERT INTO moderation_actions
                 (moderator_user_id, target_user_id, room_id, action_type, reason)
                 VALUES (:moderator, :target, :room, "delete_message", :reason)'
            );
            $log->execute([
                'moderator' => (int) $moderator['id'],
                'target' => $targetUserId,
                'room' => $roomId,
                'reason' => 'Nachricht #' . $messageId . ' moderativ gelöscht',
            ]);
            $db->commit();
            respond(['ok' => true]);
            break;

        case 'profile':
            requireMethod('GET');
            $viewer = requireUser($db);
            $targetId = isset($_GET['user_id']) && $_GET['user_id'] !== ''
                ? positiveInt($_GET['user_id'])
                : (int) $viewer['id'];
            $profile = chatProfile($db, $targetId, $targetId === (int) $viewer['id']);
            if (!$profile) {
                apiError('Dieses Profil wurde nicht gefunden.', 404);
            }
            respond(['ok' => true, 'profile' => $profile]);
            break;

        case 'profile_update':
            requireMethod('POST');
            $user = requireUser($db);
            requireCsrf($input);
            rateLimit('profile_update', 1.0);
            $username = trim((string) ($input['username'] ?? ''));
            $email = trim((string) ($input['email'] ?? ''));
            $phone = trim((string) ($input['phone'] ?? ''));
            $website = trim((string) ($input['website'] ?? ''));
            $social = trim((string) ($input['social'] ?? ''));
            $bio = trim((string) ($input['bio'] ?? ''));

            if (!preg_match('/^[\p{L}\p{N}_\- ]{3,24}$/u', $username)) {
                apiError('Der Nickname muss 3 bis 24 Buchstaben, Zahlen, Leerzeichen, _ oder - enthalten.', 422);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
                apiError('Bitte gib eine gültige E-Mail-Adresse ein.', 422);
            }
            if (textLength($phone) > 40 || textLength($bio) > 500) {
                apiError('Telefonnummer oder Profiltext ist zu lang.', 422);
            }
            foreach (['Webseite' => $website, 'Social-Media-Link' => $social] as $label => $url) {
                if ($url !== '' && (strlen($url) > 300 || !filter_var($url, FILTER_VALIDATE_URL) || !in_array(strtolower((string) parse_url($url, PHP_URL_SCHEME)), ['http', 'https'], true))) {
                    apiError($label . ' muss eine gültige HTTP- oder HTTPS-Adresse sein.', 422);
                }
            }

            try {
                $db->beginTransaction();
                $account = $db->prepare('UPDATE users SET username = :username, email = :email WHERE id = :id');
                $account->execute(['username' => $username, 'email' => $email, 'id' => (int) $user['id']]);
                $profileUpdate = $db->prepare(
                    'INSERT INTO user_profiles (user_id, phone, website, social_links_json, bio, online_status)
                     VALUES (:id, :phone, :website, :social, :bio, "online")
                     ON CONFLICT(user_id) DO UPDATE SET
                        phone = excluded.phone,
                        website = excluded.website,
                        social_links_json = excluded.social_links_json,
                        bio = excluded.bio'
                );
                $profileUpdate->execute([
                    'id' => (int) $user['id'],
                    'phone' => $phone,
                    'website' => $website,
                    'social' => json_encode(['primary' => $social], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'bio' => $bio,
                ]);
                $db->commit();
            } catch (PDOException $exception) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                if ((int) $exception->getCode() === 23000 || strpos($exception->getMessage(), 'UNIQUE') !== false) {
                    apiError('Nickname oder E-Mail-Adresse wird bereits verwendet.', 409);
                }
                throw $exception;
            }
            respond(['ok' => true, 'user' => currentUser($db), 'profile' => chatProfile($db, (int) $user['id'], true)]);
            break;

        default:
            apiError('Unbekannte API-Aktion.', 404);
    }
} catch (Throwable $exception) {
    error_log('[Desktop API] ' . $exception->getMessage());
    apiError('Interner Serverfehler. Details stehen im PHP-Fehlerprotokoll.', 500);
}

function readInput(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

function requireMethod(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        header('Allow: ' . $method);
        apiError('Nicht erlaubte HTTP-Methode.', 405);
    }
}

function requireCsrf(array $input): void
{
    $token = (string) ($input['csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    if ($token === '' || !hash_equals((string) ($_SESSION['csrf'] ?? ''), $token)) {
        apiError('Die Sicherheitsprüfung ist abgelaufen. Bitte lade die Seite neu.', 419);
    }
}

function authenticateSession(int $userId): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function currentUser(PDO $db): ?array
{
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    $statement = $db->prepare(
        'SELECT u.id, u.username, u.email, u.status, r.name AS role,
                p.avatar_path, p.phone, p.website, p.social_links_json, p.bio
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id = :id
         LIMIT 1'
    );
    $statement->execute(['id' => (int) $_SESSION['user_id']]);
    $user = $statement->fetch();
    return $user ? normalizeProfileRow($user, true) : null;
}

function chatProfile(PDO $db, int $userId, bool $includePrivate): ?array
{
    $statement = $db->prepare(
        'SELECT u.id, u.username, u.email, u.status, r.name AS role,
                p.avatar_path, p.phone, p.website, p.social_links_json, p.bio
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id = :id AND u.status NOT IN ("banned", "suspended")
         LIMIT 1'
    );
    $statement->execute(['id' => $userId]);
    $profile = $statement->fetch();
    if (!$profile) {
        return null;
    }
    return normalizeProfileRow($profile, $includePrivate);
}

function normalizeProfileRow(array $profile, bool $includePrivate): array
{
    $links = json_decode((string) ($profile['social_links_json'] ?? '{}'), true);
    $profile['social'] = is_array($links) ? (string) ($links['primary'] ?? '') : '';
    unset($profile['social_links_json']);
    if (!$includePrivate) {
        unset($profile['email'], $profile['phone']);
    }
    return $profile;
}

function requireUser(PDO $db): array
{
    $user = currentUser($db);
    if (!$user) {
        apiError('Bitte melde dich zuerst an.', 401);
    }
    return $user;
}

function requireModerator(PDO $db): array
{
    $user = requireUser($db);
    if (!in_array($user['role'], ['moderator', 'admin'], true)) {
        apiError('Dafür werden Moderationsrechte benötigt.', 403);
    }
    return $user;
}

function roomList(PDO $db): array
{
    return $db->query(
        'SELECT id, name, description, visibility
         FROM chat_rooms
         WHERE visibility = "public"
         ORDER BY id'
    )->fetchAll();
}

function onlineUsers(PDO $db): array
{
    $statement = $db->query(
        'SELECT u.id, u.username, r.name AS role, p.avatar_path,
                CASE WHEN u.last_seen_at >= datetime("now", "-5 minutes") THEN "online" ELSE "away" END AS status
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.status NOT IN ("banned", "suspended")
           AND u.last_seen_at >= datetime("now", "-30 minutes")
         ORDER BY r.rank DESC, u.username COLLATE NOCASE
         LIMIT 100'
    );
    return $statement->fetchAll();
}

function assertRoomExists(PDO $db, int $roomId): void
{
    $statement = $db->prepare('SELECT 1 FROM chat_rooms WHERE id = :id AND visibility = "public"');
    $statement->execute(['id' => $roomId]);
    if (!$statement->fetchColumn()) {
        apiError('Der Chatraum wurde nicht gefunden.', 404);
    }
}

function positiveInt(mixed $value): int
{
    $integer = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($integer === false) {
        apiError('Ungültige numerische Angabe.', 422);
    }
    return (int) $integer;
}

function normalizeMessage(string $body): string
{
    $body = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $body) ?? '';
    return trim($body);
}

function textLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function rejectSpam(string $body): void
{
    $normalized = strtolower(trim(preg_replace('/\s+/', ' ', $body) ?? $body));
    $recent = $_SESSION['recent_messages'] ?? [];
    $now = microtime(true);
    $recent = array_values(array_filter($recent, static fn(array $entry): bool => ($now - (float) $entry['time']) < 30));
    $duplicates = array_filter($recent, static fn(array $entry): bool => hash_equals((string) $entry['hash'], hash('sha256', $normalized)));
    if (count($recent) >= 8 || count($duplicates) >= 2) {
        apiError('Spam-Schutz: Bitte warte kurz und wiederhole Nachrichten nicht.', 429);
    }
    $recent[] = ['time' => $now, 'hash' => hash('sha256', $normalized)];
    $_SESSION['recent_messages'] = $recent;
}

function rateLimit(string $bucket, float $seconds): void
{
    $now = microtime(true);
    $last = (float) ($_SESSION['rate_limits'][$bucket] ?? 0);
    if (($now - $last) < $seconds) {
        apiError('Bitte warte einen Moment und versuche es erneut.', 429);
    }
    $_SESSION['rate_limits'][$bucket] = $now;
}

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function apiError(string $message, int $status = 400): never
{
    respond(['ok' => false, 'error' => $message], $status);
}
