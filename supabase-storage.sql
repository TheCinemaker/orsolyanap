-- =====================================================================
-- ORSOLYA-NAPI VÁSÁR • KÉPTÁROLÓ (SUPABASE STORAGE)
-- Safe Schema Script: Does NOT drop buckets or delete any existing file!
--
-- Futtatás: Supabase Dashboard → SQL Editor → New query → beilleszt → Run
--
-- MIÉRT KELL:
-- A képek most base64-ként az adatbázis oszlopaiba vannak beégetve. Ezt a
-- böngésző NEM tudja külön cache-elni és nem tudja később betölteni: minden
-- látogató letölti az összes képet az app indulásakor. 15 ételfotóval már
-- 1 MB-nál vagyunk, 90-nél ez ~5 MB lenne - az app teljes JS-e 203 kB.
--
-- Storage-ba töltve a képek rendes fájlok lesznek: a böngésző lazy-n tölti
-- be őket, cache-eli, és az adatbázis pár száz byte-os URL-eket tárol.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. BUCKETEK
-- ---------------------------------------------------------------------
-- public = true  ->  a fájlok URL-lel olvashatók, bejelentkezés nélkül.
--                    (Egy vásári ételfotó nyilvános tartalom.)
-- file_size_limit ->  5 MB / fájl, hogy egy véletlen 50 MB-os kép ne menjen fel.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('etelek', 'etelek', true, 5242880, array['image/webp','image/jpeg','image/png']),
  ('logok',  'logok',  true, 5242880, array['image/webp','image/jpeg','image/png','image/svg+xml'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ---------------------------------------------------------------------
-- 2. ÍRÁSI JOG
-- ---------------------------------------------------------------------
-- Olvasáshoz nem kell policy: a public bucketek tartalma URL-lel elérhető.
-- Íráshoz viszont kell, különben a feltöltés RLS-hibára fut.
--
-- FIGYELEM: ez a policy az `anon` kulccsal is engedi a feltöltést, és az
-- anon kulcs benne van a kliens bundle-ben. Vagyis aki megnézi a letöltött
-- JS-t, tud fájlt tölteni EBBE A KÉT BUCKETBE (máshová nem, és az
-- adatbázishoz nem kap jogot). Két napra ez vállalható kompromisszum.
--
-- Ha szigorúbbat szeretnél: hagyd ki ezt a 2. szakaszt, és add meg nekem a
-- service_role kulcsot a .env fájlban - akkor a feltöltés azzal megy, és
-- senki más nem tud írni a bucketbe.

drop policy if exists "orsolya kepek feltoltes" on storage.objects;
create policy "orsolya kepek feltoltes"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id in ('etelek', 'logok'));

drop policy if exists "orsolya kepek frissites" on storage.objects;
create policy "orsolya kepek frissites"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id in ('etelek', 'logok'));

-- Törlés szándékosan NINCS engedélyezve: egy rossz kép felülírható
-- (frissítés), de kitörölni csak a Supabase felületéről lehet.


-- ---------------------------------------------------------------------
-- 3. ELLENŐRZÉS
-- ---------------------------------------------------------------------
-- Futtatás után ezt a két sort látnod kell: etelek és logok, mindkettő public.

select id, name, public, file_size_limit
from storage.buckets
where id in ('etelek', 'logok')
order by id;
