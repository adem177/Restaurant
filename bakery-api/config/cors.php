<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Allowed origins are read from the CLIENT_ORIGINS env var (comma-separated).
    | Defaults to the local Vite dev server.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_map(
        'trim',
        explode(',', env('CLIENT_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost')),
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
