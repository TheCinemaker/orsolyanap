-- ===========================================================================
--  Böngészőből feltöltött képek: Storage, base64 helyett
--
--  Futtatás: Supabase -> SQL Editor -> beilleszt -> Run.
--  Újrafuttatható.
--
--  MIÉRT: eddig minden böngészőből feltöltött kép base64-ként, az adatbázis
--  sorában utazott. Egy ilyen sor minden látogatónak lejön minden
--  megnyitáskor, mielőtt bármit látna -- egyetlen 3 MB-os kép egyszer már
--  tizennégyszeresére hizlalta az app indulását. Storage-ból a kép külön,
--  lustán, gyorsítótárazva jön, és csak annak, aki tényleg megnézi.
-- ===========================================================================

-- ---------------------------------------------------------------------------
--  1. A reel-fotók tárhelye
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reels', 'reels', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- ---------------------------------------------------------------------------
--  2. Feltöltési jog a böngészőnek -- CSAK a feltoltes/ mappába
--
--  A kiállítói fotókat a gépről futó szkriptek `<id>.webp` néven töltik fel,
--  tehát az útvonaluk kitalálható. Ha a böngésző bárhova írhatna, elég lenne
--  ráhibázni egy névre, és felül lehetne írni egy stand logóját vagy egy étel
--  fotóját. Ezért a böngésző csak a `feltoltes/` mappába szúrhat be, és csak
--  BESZÚRNI tud: felülírni és törölni nem.
-- ---------------------------------------------------------------------------
drop policy if exists "bongeszo_feltoltes" on storage.objects;
create policy "bongeszo_feltoltes" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id in ('reels', 'etelek', 'logok')
    and (storage.foldername(name))[1] = 'feltoltes'
  );

-- Olvasás: ezek publikus bucketek, a képeket mindenki látja.
drop policy if exists "bongeszo_olvasas" on storage.objects;
create policy "bongeszo_olvasas" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('reels', 'etelek', 'logok'));
