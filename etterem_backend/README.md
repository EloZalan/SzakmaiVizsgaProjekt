# Éttermi rendszer – Backend

A **Grillhouse** éttermi rendszer szerveroldali komponense. REST API-t biztosít a webes kliens számára: kezeli a felhasználókat, foglalásokat, asztalokat, rendeléseket, fizetéseket és az admin funkciókat.

## Főbb funkciók

- **Hitelesítés:** token alapú bejelentkezés, szerepkörök: `admin`, `waiter`.
- **Foglaláskezelés:** vendég foglalások rögzítése és kezelése, walk-in foglalás pincér által.
- **Asztalkezelés:** asztalok állapotának nyilvántartása valós időben.
- **Rendelésfolyamat:** rendelés megnyitása, tételek hozzáadása/törlése, fizetés rögzítése.
- **Pincér meghívás:** admin e-mail tokennel hívja meg a pincéreket, akik a linken állítanak jelszót.
- **Menükezelés:** kategóriák és menüelemek CRUD admin felületről.
- **Statisztikák:** napi bevétel, mai vendégszám, vendégforgalom előzmények.

## Szerepkörök és hozzáférés

| Szerepkör | Elérhető műveletek |
|-----------|-------------------|
| Vendég (nem bejelentkezett) | Foglalás létrehozása, menü megtekintése |
| Pincér (műszakban) | Asztalok, rendelések, foglalások kezelése |
| Admin | Teljes hozzáférés + személyzet és statisztikák |

## Telepítés és indítás

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

Az API alapértelmezetten a `https://jcloud02.jedlik.eu/schmitzhofer.pal/backend` címen érhető el.

## Teszt adatok (seed után)

- **Admin:** `admin@admin.com` / `admin`
- **Pincérek jelszava:** `password123`

## Pincér meghívó e-mail

A meghívási folyamat végpontjai:

- `POST /api/admin/waiters` – meghívó létrehozása és e-mail küldése.
- `GET /api/waiter-invites/{token}` – token ellenőrzése.
- `POST /api/waiter-invites/{token}/accept` – jelszó beállítása, fiók aktiválása.

Szükséges `.env` változók az e-mail küldéshez:

- `FRONTEND_URL` – a frontend alkalmazás alap URL-je (pl. `https://jcloud02.jedlik.eu/schmitzhofer.pal/frontend`).
- `MAIL_MAILER=smtp` – valódi küldéshez (ha `log`, az e-mailek csak a naplóba kerülnek).
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`.

## Tesztek futtatása

```bash
php artisan test
```

## API dokumentáció

A végpontok részletes leírása a `swagger.yaml` fájlban található.
