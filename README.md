# Szakmai Vizsga Projekt – Éttermi rendszer

Ez a projekt egy modern éttermi működést támogató rendszer, amely egy helyen kezeli a foglalásokat, az asztalok állapotát, a rendelések életciklusát és az adminisztrációs feladatokat.

## A projekt célja

A rendszer célja, hogy az étterem mindennapi folyamatait gyorsabbá és átláthatóbbá tegye:

- a vendégek egyszerűen tudjanak foglalni,
- a pincérek valós időben lássák a teendőiket,
- a vezetés azonnali képet kapjon a napi működésről.

## Mit tud a rendszer?

- **Foglaláskezelés:** online foglalások felvétele és kezelése.
- **Asztalkezelés:** asztalok aktuális állapotának nyomon követése.
- **Rendelésfolyamat:** rendelés nyitása, tételek kezelése, fizetés.
- **Pincér munkafolyamat:** műszakkezdés/műszakzárás és napi feladatok támogatása.
- **Admin felület:** személyzet, asztalok és menü elemek kezelése.
- **Statisztikák:** napi bevétel és vendégforgalom áttekintése.

## Szerepkörök

- **Vendég:** foglalást tud kezdeményezni.
- **Pincér:** a napi operatív éttermi feladatokat végzi a rendszerben.
- **Admin:** a teljes működéshez szükséges beállításokat és erőforrásokat kezeli.

## Kinek készült?

A projekt elsősorban oktatási célú szakmai vizsgamunka, de valós éttermi működési logikát követ, így gyakorlati környezetben is jól értelmezhető.

## Készítők

- **Élő Zalán László**
- **Fazekas Botond**
- **Schmitzhofer Pál**

## Rövid technikai háttér

A megoldás két részből áll:

- `etterem_backend`: backend API
- `etterem_frontend/grillhouse`: webes kliens

Részletes technikai és deploy információk:

- `etterem_backend/README.md`
- `etterem_frontend/grillhouse/README.md`
- `etterem_backend/deploy_backend.md`
