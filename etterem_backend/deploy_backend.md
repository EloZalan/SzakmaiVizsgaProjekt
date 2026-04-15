# Laravel deploy (backend + backendcore)

## 1) Elokeszites lokalisan

Az `etterem_backend` mappaban futtasd:

- `php artisan key:generate --force`
- `php artisan config:clear`
- `php artisan route:clear`

Ha van frontend build (Vite):

- `npm.cmd install`
- `npm.cmd run build`

Ha nincs `vendor` mappa:

- `composer install --no-dev --optimize-autoloader`

Ha mar letezik `vendor`, akkor ez a lepés kihagyhato.

## 2) Production .env masolat

Keszits masolatot az eredeti `.env`-rol pl. `.env.production` neven, es allitsd be:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://jcloud02.jedlik.eu/schmitzhofer.pal/backend`

## 3) FTP feltoltes (backend + backendcore)

Cel: `public_html/backend` es `public_html/backendcore`

- `public_html/backendcore`:
  - ide menjen az osszes backend fajl/mappa,
  - **kiveve** a `public` mappa tartalma.
- `public_html/backend`:
  - ide menjen a helyi `public` mappa tartalma (`index.php`, `.htaccess`, `build`, stb.).

`node_modules` mappat ne toltsd fel.

## 4) public/.htaccess modositasa

A `public_html/backend/.htaccess` utolso rewrite sora legyen:

```apache
RewriteRule ^ schmitzhofer.pal/backend/index.php [L]
```

## 5) public/index.php modositasa

A `public_html/backend/index.php` fajlban a ket utvonal:

```php
require __DIR__.'/../backendcore/vendor/autoload.php';
$app = require_once __DIR__.'/../backendcore/bootstrap/app.php';
```

## 6) Biztonsag (backendcore)

Hozz letre `public_html/backendcore/.htaccess` fajlt:

```apache
Options -Indexes
<Files .env>
    Order allow,deny
    Deny from all
</Files>
```

## 7) Opcionlis minimalizalas backendcore gyokerben

A `public_html/backendcore` gyokerben megtarthatod csak ezeket:

- `.env` (production)
- `composer.json`
- `.htaccess`

A mappak maradjanak, mert a Laravelnek kellenek.
