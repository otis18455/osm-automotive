<?php
// Zoekt een Belgische nummerplaat op via Inmotiv Autoconnect LOOKUP (betaald per opzoeking).
// De API-sleutel staat in api/config.php (kopieer config.example.php) en komt nooit in de browser.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function fail($code, $msg) { http_response_code($code); echo json_encode(['error' => $msg]); exit; }

$cfgFile = __DIR__ . '/config.php';
if (!file_exists($cfgFile)) fail(503, 'not_configured');
$cfg = require $cfgFile;
if (empty($cfg['api_key'])) fail(503, 'not_configured');
$blocks    = $cfg['blocks']       ?? 'BR';  // B = basisgegevens, R = inschrijving (bouwjaar)
$perIpHour = $cfg['max_per_ip_hour'] ?? 3;  // max. opzoekingen per bezoeker per uur
$perIpDay  = $cfg['max_per_ip_day']  ?? 6;  // max. opzoekingen per bezoeker per dag
$perDay    = $cfg['max_per_day']     ?? 100; // max. opzoekingen in totaal per dag (kostenplafond)
$cacheTtl  = $cfg['cache_hours']     ?? 24;  // dezelfde plaat binnen deze tijd is gratis

$plate = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $_GET['plate'] ?? ''));
// nieuwe (1ABC123) en oudere (ABC123 / 123ABC) Belgische nummerplaten
if (!preg_match('/^([1-9][A-Z]{3}\d{3}|[A-Z]{3}\d{3}|\d{3}[A-Z]{3})$/', $plate)) fail(400, 'invalid_plate');

$dir = __DIR__ . '/cache';
if (!is_dir($dir)) @mkdir($dir, 0700, true);
if (!is_dir($dir) || !is_writable($dir)) fail(500, 'server_error');

// 1) Zelfde plaat al opgezocht? Geef het bewaarde antwoord terug (geen extra kosten, telt niet mee).
$cacheFile = $dir . '/plate_' . md5($plate . $blocks) . '.json';
if (file_exists($cacheFile) && filemtime($cacheFile) > time() - $cacheTtl * 3600) {
    echo json_encode(['data' => json_decode(file_get_contents($cacheFile), true), 'cached' => true]);
    exit;
}

// 2) Limieten (alleen echte opzoekingen tellen mee)
function hits($file, $window) {
    $t = file_exists($file) ? array_map('intval', explode(',', (string)file_get_contents($file))) : [];
    return array_values(array_filter($t, fn($x) => $x > time() - $window));
}
$ip = md5($_SERVER['REMOTE_ADDR'] ?? 'x');
$ipFile = $dir . '/ip_' . $ip . '.txt';
$dayFile = $dir . '/day_' . date('Ymd') . '.txt';
$ipHits = hits($ipFile, 86400);
if (count(array_filter($ipHits, fn($x) => $x > time() - 3600)) >= $perIpHour || count($ipHits) >= $perIpDay) fail(429, 'rate_limited');
if (count(hits($dayFile, 86400)) >= $perDay) fail(429, 'daily_limit');

// 3) Opzoeken bij Inmotiv
$url = 'https://api.inmotiv.be/rest/lookup/1.6/plate/' . rawurlencode($cfg['api_key']) . '/' . $plate . '/' . rawurlencode($blocks);
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($body === false) fail(502, 'upstream_unreachable');
if ($status === 404) fail(404, 'not_found');
if ($status < 200 || $status >= 300) fail(502, 'upstream_error');
$json = json_decode($body, true);
if ($json === null) fail(502, 'upstream_invalid');

// 4) Bewaren en tellen
file_put_contents($cacheFile, json_encode($json));
$ipHits[] = time();            file_put_contents($ipFile, implode(',', $ipHits));
$d = hits($dayFile, 86400); $d[] = time(); file_put_contents($dayFile, implode(',', $d));

echo json_encode(['data' => $json]);
