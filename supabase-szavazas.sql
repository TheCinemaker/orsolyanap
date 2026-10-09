-- =====================================================================
-- ORSOLYA-NAPI VÁSÁR • KÖZÖNSÉGSZAVAZÁS - ATOMI SZÁMLÁLÁS
-- Safe Schema Script: Does NOT drop or delete anything!
--
-- Futtatás: Supabase Dashboard → SQL Editor → New query → beilleszt → Run
--
-- MIÉRT KELL:
-- Az app eddig így szavazott: a telefon kiolvasta az általa ISMERT
-- szavazatszámot, hozzáadott egyet, és a kapott ABSZOLÚT értéket írta ki.
--
--   két telefon, mindkettő 100-at lát  ->  mindkettő 101-et ír  ->  101 lesz
--   (egy szavazat elveszett)
--
-- Leméraettük: öt egyidejű szavazatból EGY maradt meg, négy elveszett.
-- Rosszabb eset: egy telefon, ami egy órával korábban töltötte be az
-- oldalt, 50-et lát. Ha akkor szavaz, 51-et ír ki, és ezzel TÖRLI a közben
-- leadott összes szavazatot. Egy fesztiválon, több száz egyszerre nézegető
-- vendéggel ez nem elméleti kockázat.
--
-- A MEGOLDÁS: az összeadás az ADATBÁZISBAN történjen, ne a telefonon.
-- A `votes = votes + 1` kifejezést a Postgres a soron, zárolás alatt
-- értékeli ki, így két egyidejű szavazat sem írhatja felül egymást.
-- =====================================================================


create or replace function public.increment_item_votes(item_id text)
returns integer
language sql
-- security definer: a függvény a definiálója jogával fut, így akkor is
-- működik, ha a táblán szigorítanánk az írási jogot. Új hozzáférést nem
-- ad: a szavazatszám növelése eddig is ment az anon kulccsal.
security definer
set search_path = public
as $$
  update public.menu_items
     set votes = coalesce(votes, 0) + 1
   where id = item_id
  returning votes;
$$;

-- Az app az anon kulccsal hívja.
grant execute on function public.increment_item_votes(text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- ELLENŐRZÉS
-- ---------------------------------------------------------------------
-- Ez a lekérdezés egy sort ad vissza, ha a függvény létrejött:

select p.proname as fuggveny, pg_get_function_arguments(p.oid) as parameterek
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'increment_item_votes';
