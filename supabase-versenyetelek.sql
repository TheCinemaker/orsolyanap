-- ===========================================================================
--  Versenyételek jelölése
--
--  Futtatás: Supabase -> SQL Editor -> beilleszt -> Run.
--
--  A főzőversenyre nevezett fogásokat meg kell tudni különböztetni a stand
--  többi kínálatától. Jelzőt kap, nem a nevébe írjuk bele: a "(verseny)"
--  toldalék elcsúfítaná a kártyát, és a keresésbe is beleszólna.
--
--  Alapból hamis, tehát a standok által később felvett ételek nem lesznek
--  véletlenül versenyételek.
-- ===========================================================================
alter table menu_items
  add column if not exists is_competition boolean not null default false;

create index if not exists menu_items_competition_idx
  on menu_items (is_competition) where is_competition;
