#!/bin/bash
set -e

# Railway assigns a dynamic PORT – make Apache listen on it.
if [ -n "$PORT" ] && [ "$PORT" != "80" ]; then
    sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
    sed -i "s/:80/:${PORT}/g" /etc/apache2/sites-available/*.conf
    sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/*.conf
fi

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Cache config and routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Seed if DB is empty (first deployment)
php artisan db:seed --force 2>/dev/null || true

exec "$@"
