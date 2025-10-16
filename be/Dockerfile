# --- Base image ---
FROM php:8.3-fpm

# --- Install system dependencies ---
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# --- Install Composer ---
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# --- Set working directory ---
WORKDIR /var/www

# --- Copy all files ---
COPY . .

# --- Install PHP dependencies ---
RUN composer install --no-dev --optimize-autoloader

# --- Set file permissions ---
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# --- Expose PHP-FPM port ---
EXPOSE 9000

# --- Run PHP-FPM ---
CMD ["php-fpm"]
