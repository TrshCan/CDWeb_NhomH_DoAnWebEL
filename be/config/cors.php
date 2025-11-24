<?php

return [
    'paths' => ['api/*', 'graphql', '*', 'sanctum/csrf-cookie'], // Include your GraphQL endpoint
    'allowed_methods' => ['*'], // Allow all HTTP methods (GET, POST, OPTIONS, etc.)
    'allowed_origins' => ['*'], // Your Vite frontend URL
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'], // Allow all headers
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];