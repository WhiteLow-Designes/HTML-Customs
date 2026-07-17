<?php
declare(strict_types=1);

/*
 * Optionale Produktionskonfiguration.
 * Keine echten Zugangsdaten in Git oder im öffentlich erreichbaren Ordner ablegen.
 */
return [
    'app_environment' => 'production',
    'base_url' => 'https://desktop.example.invalid',
    'max_upload_bytes' => 20 * 1024 * 1024,
    'allowed_image_types' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'allowed_video_types' => ['video/mp4', 'video/webm'],
    'session_lifetime_seconds' => 86400,
];

