<?php

// Vercel routes all requests to api/index.php, but we want Laravel to
// process the full URI (including /api/). By faking SCRIPT_NAME, Laravel won't
// strip the /api directory from the URI path.
$_SERVER['SCRIPT_NAME'] = '/index.php';

// Forward all requests to Laravel's public/index.php
require __DIR__ . '/../public/index.php';
