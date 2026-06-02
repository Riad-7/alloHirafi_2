#!/bin/bash
set -e

# Railway assigns a dynamic PORT – make Apache listen on it.
if [ -n "$PORT" ] && [ "$PORT" != "80" ]; then
    sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
    sed -i "s/:80/:${PORT}/g" /etc/apache2/sites-available/*.conf
    sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/*.conf
fi

# Create .env file from environment variables if it doesn't exist
# Railway injects env vars at runtime, but Laravel needs a .env file for some commands
if [ ! -f /var/www/html/.env ]; then
    touch /var/www/html/.env
fi

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Clear any stale caches from build phase
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

# Cache config and routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Seed if DB is empty (first deployment)
php artisan db:seed --force 2>/dev/null || true

# Create storage link (safe to re-run)
php artisan storage:link 2>/dev/null || true

exec "$@"
