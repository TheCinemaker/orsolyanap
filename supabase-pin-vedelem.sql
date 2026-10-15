-- ===========================================================================
--  A PIN KÓDOK ELREJTÉSE A BÖNGÉSZŐ ELŐL
--
--  Futtatás: Supabase -> SQL Editor -> beilleszt -> Run.
--  Újrafuttatható, nem bánt meglévő adatot.
--
--  MI A BAJ MOST:
--  az app `select('*')`-ot kér az exhibitors táblán, és az anon kulcs minden
--  oszlopot olvashat — a `pin`-t is. Vagyis MINDEN LÁTOGATÓ böngészője
--  letölti mind a 38 stand PIN kódját. Nem kell hozzá semmit keresni: aki
--  megnyitja a fejlesztői eszközöket, látja az egész listát, és bármelyik
--  stand nevében beléphet, átírhatja az étlapját.
--
--  Ez más, mint a szervezői kód a kliensoldali kódban: azt meg kell keresni a
--  letöltött JS-ben. Ez automatikusan odakerül minden telefonra.
--
--  MI LESZ UTÁNA:
--  a `pin` oszlopot az anon kulcs nem olvashatja. A belépés egy függvényen
--  megy (`login_exhibitor`), ami a beírt kódra ad vissza standot — a listát
--  nem adja ki. A szervezői jegyzék a `pin_jegyzek` függvényen, ami a
--  szervezői kódot kéri.
--
--  SORREND: ezt az SQL-t a kód kirakása UTÁN is le lehet futtatni, és előtte
--  is. A kliens először a függvényt próbálja, és ha az még nincs meg, a régi
--  úton lép be. Így nincs olyan pillanat, amikor a standosok nem tudnak
--  bejutni.
-- ===========================================================================

-- ---------------------------------------------------------------------------
--  Belépés: a beírt PIN-re megmondja, melyik stand az
--
--  Csak EGY standot ad vissza, és csak akkor, ha a kód stimmel. A teljes
--  listát nem lehet belőle kiszedni, és a hibás kódra nem derül ki semmi.
-- ---------------------------------------------------------------------------
create or replace function login_exhibitor(p_pin text)
returns json
language sql
security definer
set search_path = public
as $$
  select ((to_jsonb(e.*) - 'created_at')::json)
    from exhibitors e
   where btrim(e.pin) = btrim(coalesce(p_pin, ''))
   limit 1;
$$;

-- ---------------------------------------------------------------------------
--  Szervezői PIN-jegyzék
--
--  A szervező kódja nyitja. Ez a kód a kliensoldali kódban van, tehát a
--  letöltött JS-ből kiolvasható — a véletlen hozzáférést zárja, a szándékos
--  keresőt nem. Ez tudatos döntés a rendezvény két napjára; a lényeg, hogy a
--  PIN-ek ne kerüljenek ki MINDEN látogató telefonjára maguktól.
-- ---------------------------------------------------------------------------
create or replace function pin_jegyzek(p_kod text)
returns table (id text, name text, location text, days text, pin text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if btrim(coalesce(p_kod, '')) <> '0169' then
    raise exception 'nincs jogosultsag';
  end if;

  return query
    select e.id, e.name, e.location, e.days, e.pin
      from exhibitors e
     order by e.name;
end;
$$;

-- ---------------------------------------------------------------------------
--  PIN átírása a jegyzékből
--
--  Közvetlenül már nem lehet: a `pin` oszlopra az anon kulcsnak nincs
--  írási joga. Ez a függvény a szervezői kódot kéri.
-- ---------------------------------------------------------------------------
create or replace function set_exhibitor_pin(p_id text, p_kod text, p_uj_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_db integer;
begin
  if btrim(coalesce(p_kod, '')) <> '0169' then
    raise exception 'nincs jogosultsag';
  end if;

  if btrim(coalesce(p_uj_pin, '')) !~ '^[0-9]{4,6}$' then
    raise exception 'a pin 4-6 szamjegy legyen';
  end if;

  update exhibitors
     set pin = btrim(p_uj_pin)
   where id = p_id;
  get diagnostics v_db = row_count;
  return v_db > 0;
end;
$$;

-- ---------------------------------------------------------------------------
--  A `pin` oszlop elvétele a böngészőtől
--
--  OLVASÁS: oszloponként adjuk vissza a jogot, a `pin` kimarad. Emiatt a
--  `select('*')` HIBÁT AD — ezért kér a kliens felsorolt oszlopokat. Ha a
--  régi kód fut és új a séma, az app nem tölt be: a két lépés sorrendje
--  tehát kód először, SQL utána.
--
--  ÍRÁS: a pin oszlopra nincs update jog (arra van a fenti függvény), de az
--  INSERT megmarad: új csapat felvételekor a jegyzék a PIN-t is beírja.
-- ---------------------------------------------------------------------------
do $$
declare
  v_oszlopok text;
  v_szerep text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_oszlopok
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'exhibitors'
     and column_name <> 'pin';

  foreach v_szerep in array array['anon', 'authenticated']
  loop
    execute format('revoke select on table public.exhibitors from %I', v_szerep);
    execute format('revoke update on table public.exhibitors from %I', v_szerep);
    execute format('grant select (%s) on table public.exhibitors to %I', v_oszlopok, v_szerep);
    execute format('grant update (%s) on table public.exhibitors to %I', v_oszlopok, v_szerep);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  Realtime: a változás-értesítés se szállítsa ki a PIN-t
--
--  A realtime a soron alapul, és az RLS-t nézi, az oszlopjogokat nem: egy
--  profilmentés UPDATE-je a `pin`-t is kiküldené a feliratkozóknak. A
--  publikációhoz PostgreSQL 15 óta adható oszloplista, ezért ezt itt
--  megpróbáljuk, és ha nem megy, csak figyelmeztetünk: a tábla marad a
--  publikációban, mert a realtime nélkül az app élő frissítése állna meg.
-- ---------------------------------------------------------------------------
do $$
declare
  v_oszlopok text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_oszlopok
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'exhibitors'
     and column_name <> 'pin';

  begin
    if exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'exhibitors'
    ) then
      alter publication supabase_realtime drop table public.exhibitors;
    end if;
    execute format('alter publication supabase_realtime add table public.exhibitors (%s)', v_oszlopok);
    raise notice 'A realtime mostantol a pin oszlop nelkul kuldi az exhibitors valtozasait.';
  exception
    when others then
      -- Visszatesszük oszloplista nélkül, hogy az élő frissítés megmaradjon.
      begin
        alter publication supabase_realtime add table public.exhibitors;
      exception when others then null;
      end;
      raise warning 'Az oszloplistas publikacio nem sikerult (%). A realtime tovabb kuldi a pin-t is a valtozo soroknal.', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
--  Jogosultságok a függvényekre
--
--  A PUBLIC-tól kell megvonni, nem csak az anon-tól: a PostgreSQL minden új
--  funkcióra alapból a PUBLIC szerepnek adja a futtatási jogot, és az anon
--  annak tagja.
-- ---------------------------------------------------------------------------
revoke all on function login_exhibitor(text) from public;
revoke all on function pin_jegyzek(text) from public;
revoke all on function set_exhibitor_pin(text, text, text) from public;
grant execute on function login_exhibitor(text)                to anon, authenticated;
grant execute on function pin_jegyzek(text)                    to anon, authenticated;
grant execute on function set_exhibitor_pin(text, text, text)  to anon, authenticated;

-- ---------------------------------------------------------------------------
--  Ellenőrzés: ez után a lekérdezés után NEM szabad látszódnia a pin-nek.
--
--    set role anon;
--    select * from exhibitors limit 1;      -- hibát kell adnia (pin)
--    select id, name from exhibitors limit 1; -- ennek működnie kell
--    reset role;
-- ---------------------------------------------------------------------------
