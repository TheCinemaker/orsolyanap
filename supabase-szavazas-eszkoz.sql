-- ===========================================================================
--  Egy készülék egy szavazat (ételenként) + látogatásszámláló
--
--  Futtatás: Supabase -> SQL Editor -> beilleszt -> Run.
--  Újrafuttatható, nem bánt meglévő adatot.
-- ===========================================================================

-- ---------------------------------------------------------------------------
--  1. A szavazati napló
--
--  Eddig a "már szavaztam" csak a böngésző localStorage-ában élt, tehát a
--  szerver mindent elfogadott: egy oldalfrissítés után újra lehetett szavazni.
--  Mostantól a napló dönt, és az adatbázis zárja ki a másodszori szavazatot.
--
--  Ez a tábla az IGAZSÁG, a menu_items.votes csak gyorsítótár rajta. Ha a
--  szám bármiért elcsúszik, a lenti recount_votes() visszaállítja.
-- ---------------------------------------------------------------------------
create table if not exists item_votes (
  device_id  text not null,
  item_id    text not null references menu_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (device_id, item_id)
);

create index if not exists item_votes_item_idx on item_votes (item_id);

alter table item_votes enable row level security;
-- Szándékosan NINCS policy. A táblát csak a lenti security definer függvények
-- érik el, így a böngészőből sem olvasható, sem írható közvetlenül -- máskülönben
-- bárki beszúrhatna magának ezer sort más készülékazonosítókkal.

-- ---------------------------------------------------------------------------
--  2. Szavazás
--
--  Egy készülék egy ételre egyszer. Több ételre szavazhat, mert a vendég
--  több standnál is kóstol.
--
--  Az összeadás itt történik, nem a kliensben: két egyidejű szavazat
--  különben felülírta egymást (mérve: ötből egy maradt meg).
-- ---------------------------------------------------------------------------
create or replace function vote_for_item(p_item_id text, p_device_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_votes    integer;
  v_accepted boolean := false;
begin
  -- A rövid vagy hiányzó azonosító elírás vagy visszaélés: enélkül egyetlen
  -- "" azonosítóval az egész rendezvény egy szavazatot adhatna le.
  if p_device_id is null or length(btrim(p_device_id)) < 8 then
    raise exception 'ervenytelen keszulekazonosito';
  end if;

  insert into item_votes (device_id, item_id)
  values (btrim(p_device_id), p_item_id)
  on conflict (device_id, item_id) do nothing;

  v_accepted := found;

  if v_accepted then
    update menu_items
       set votes = coalesce(votes, 0) + 1
     where id = p_item_id
     returning votes into v_votes;
  else
    select coalesce(votes, 0) into v_votes from menu_items where id = p_item_id;
  end if;

  return json_build_object('votes', coalesce(v_votes, 0), 'accepted', v_accepted);
end;
$$;

-- Mire szavazott már ez a készülék?
-- Ezt kérdezi az app induláskor, hogy a gomb a localStorage törlése után is
-- "Szavazva" állapotban legyen.
create or replace function votes_by_device(p_device_id text)
returns setof text
language sql
security definer
set search_path = public
as $$
  select item_id from item_votes where device_id = btrim(p_device_id);
$$;

-- ---------------------------------------------------------------------------
--  3. Látogatásszámláló
--
--  Két szám: hányszor nyílt meg az oldal, és hány különböző készülékről.
--  A kettő együtt mond valamit -- 4000 megnyitás 300 készülékről más, mint
--  4000 megnyitás 3500 készülékről.
-- ---------------------------------------------------------------------------
create table if not exists app_stats (
  key   text primary key,
  value bigint not null default 0
);
alter table app_stats enable row level security;

create table if not exists app_devices (
  device_id  text primary key,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  opens      bigint not null default 0
);
alter table app_devices enable row level security;

-- Az app_stats publikus szamlalo: a lablecben mindenki latja. Olvasasra
-- nyitva, irasra nem -- azt csak a lenti security definer fuggveny vegzi.
-- Realtime-hoz EZ KELL: a feliratkozo csak olyan sort kap meg, amit olvashat.
drop policy if exists app_stats_read on app_stats;
create policy app_stats_read on app_stats for select using (true);

-- Az app_devices SZANDEKOSAN nem kap policy-t: keszulekazonositok vannak benne.

create or replace function register_visit(p_device_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opens   bigint;
  v_devices bigint;
begin
  insert into app_stats (key, value) values ('opens', 1)
  on conflict (key) do update set value = app_stats.value + 1
  returning value into v_opens;

  if p_device_id is not null and length(btrim(p_device_id)) >= 8 then
    insert into app_devices (device_id, opens)
    values (btrim(p_device_id), 1)
    on conflict (device_id) do update
      set last_seen = now(), opens = app_devices.opens + 1;
  end if;

  select count(*) into v_devices from app_devices;

  -- A keszulekszamot is ide irjuk, nem csak visszaadjuk. Realtime-ban csak
  -- olyan tablat lehet kuldeni, amit a bongeszo olvashat is -- az app_devices
  -- viszont keszulekazonositokat tartalmaz, azt nem nyitjuk ki. Igy a ket
  -- publikus szam egy helyen van, es egy feliratkozas eleg hozzajuk.
  insert into app_stats (key, value) values ('devices', v_devices)
  on conflict (key) do update set value = excluded.value;

  return json_build_object('opens', v_opens, 'devices', v_devices);
end;
$$;

-- Olvasás növelés nélkül (kijelzőhöz, szervezői nézethez).
create or replace function app_counters()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'opens',   coalesce((select value from app_stats where key = 'opens'), 0),
    'devices', (select count(*) from app_devices)
  );
$$;

-- ---------------------------------------------------------------------------
--  3b. Realtime
--
--  A szavazatok mar most elonek: a menu_items UPDATE-jere fel van iratkozva az
--  app. A szamlalohoz az app_stats-ot is be kell tenni a publikaciba, kulonben
--  a labléc csak ujratoltesre frissul.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['app_stats', 'menu_items', 'exhibitors']
  loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  4. Újraszámolás a naplóból
--
--  A menu_items.votes oszlopot a standok szerkesztő felülete is írhatja az
--  anon kulccsal, tehát a szám elvileg elállítható. A napló viszont csak
--  ezeken a függvényeken keresztül változik, így belőle a valódi állás
--  bármikor visszaállítható.
--
--  SZÁNDÉKOSAN nincs megadva az anon szerepnek: ezt csak a szervező futtatja,
--  a service_role kulccsal.
-- ---------------------------------------------------------------------------
create or replace function recount_votes()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows bigint;
begin
  -- A WHERE nem dekoracio: a Supabase biztonsagi kapcsoloja elutasitja a
  -- WHERE nelkuli UPDATE-et ("UPDATE requires a WHERE clause"), tehat enelkul
  -- a fuggveny soha nem futott volna le. Egyben csak azokat a sorokat irja at,
  -- amelyek valoban elcsusztak, es a visszaadott szam is ezt mondja meg.
  update menu_items m
     set votes = (select count(*) from item_votes v where v.item_id = m.id)
   where coalesce(m.votes, 0) <> (select count(*) from item_votes v where v.item_id = m.id);
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- ---------------------------------------------------------------------------
--  5. Jogosultságok
-- ---------------------------------------------------------------------------
grant execute on function vote_for_item(text, text)  to anon, authenticated;
grant execute on function votes_by_device(text)      to anon, authenticated;
grant execute on function register_visit(text)       to anon, authenticated;
grant execute on function app_counters()             to anon, authenticated;

-- FIGYELEM: a PostgreSQL minden uj funkciora ALAPBOL a PUBLIC szerepnek adja a
-- futtatasi jogot, es az anon annak tagja. Ezert a PUBLIC-tol kell megvonni,
-- nem csak az anon-tol -- enelkul a tiltas latszolagos. Merve: a megvonas utan
-- a bongeszo kulcsaval a recount_votes tovabbra is lefutott.
revoke execute on function recount_votes() from public;
revoke execute on function recount_votes() from anon, authenticated;

-- A regi, korlatozas nelkuli szavazofuggveny torlese.
--
-- Nem elég megvonni a jogot: amig a fuggveny letezett, egyetlen REST-hivassal
-- kikerulhette volna a keszulekenkenti korlatot -- merve: anon kulccsal
-- lefutott es megnovelte a szavazatszamot. A kod mar nem hasznalja (a kliens
-- tartalek agat is kivettuk), tehat nincs mire megtartani.
drop function if exists increment_item_votes(text);
