# Éttermi rendszer – Frontend

A **Grillhouse** éttermi rendszer webes kliensalkalmazása. Az Angular alapú felület három különböző felhasználói élményt nyújt: egy nyilvános vendégnézetet, egy pincér munkafelületet és egy admin vezérlőpultot.

## Mit láthat a felhasználó?

### Vendég
- Étlap böngészése kategóriánként.
- Asztalfoglalás létrehozása online.

### Pincér
- Műszakkezdés és műszakzárás.
- Asztalok és aktív rendelések áttekintése.
- Rendelés nyitása, tételek hozzáadása, fizetés rögzítése.
- Foglalások kezelése, walk-in vendég felvétele.

### Admin
- Személyzet kezelése (pincér meghívás e-mailben, törlés).
- Asztalok konfigurálása (hozzáadás, módosítás, törlés).
- Étlap kezelése (kategóriák és menüelemek).
- Napi statisztikák: bevétel és vendégforgalom áttekintése.

## Fejlesztői indítás

```bash
npm install
npm start
```

Az alkalmazás `https://jcloud02.jedlik.eu/schmitzhofer.pal/frontend` címen érhető el.

## Éles build

```bash
npm run build
```

## Tesztek

```bash
# Egységtesztek
npm test

# E2E tesztek (Cypress)
npm run e2e:run
```

## Backend konfiguráció

A backend API URL-je az `src/app/services/config.service.ts` fájlban állítható be.
