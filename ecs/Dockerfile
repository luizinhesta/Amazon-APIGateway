FROM php:8.2-apache

RUN docker-php-ext-install mysqli

WORKDIR /var/www/html

COPY api/ /var/www/html/
COPY lib/ /var/www/html/lib/
COPY config/ /var/www/html/config/
COPY bootstrap.php /var/www/html/bootstrap.php

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
