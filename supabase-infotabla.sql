-- ===========================================================================
--  INFÓTÁBLA: amit a standok üzennek a vásárnak
--
--  Futtatás: Supabase -> SQL Editor -> beilleszt -> Run.
--  Újrafuttatható, nem bánt meglévő adatot.
--
--  MIÉRT KÜLÖN TÁBLA, miért nem az exhibitors.notice mező:
--  a notice EGY szöveg, amit a következő felülír. Nincs szerzője, nincs
--  időpontja, és nem lehet belőle folyam. Az infótáblán viszont pont az a
--  lényeg, hogy LÁTSZIK, KI és MIKOR írta: a „Kész a gulyás!" tíz perc múlva
--  még érdekes, két óra múlva már félrevezető, és ezt csak az időpont mondja
--  meg a vendégnek. Ezért minden üzenet külön sor, és a sorok megmaradnak.
--
--  A notice megmarad, de más a dolga: az a stand ÁLLANDÓ megjegyzése
--  (allergén-infó, hol a sátor), nem időponthoz kötött hír.
-- ===========================================================================

create table if not exists stand_hirek (
  id            uuid primary key default gen_random_uuid(),
  exhibitor_id  text not null references exhibitors(id) on delete cascade,
  szoveg        text not null,
  created_at    timestamptz not null default now()
);

create index if not exists stand_hirek_ido_idx on stand_hirek (created_at desc);
create index if not exists stand_hirek_stand_idx on stand_hirek (exhibitor_id, created_at desc);

alter table stand_hirek enable row level security;

-- OLVASNI bárki olvashat: ez egy nyilvános infótábla, és a realtime is ezen
-- a policyn keresztül szállítja a frissítést a telefonokra.
drop policy if exists stand_hirek_olvasas on stand_hirek;
create policy stand_hirek_olvasas on stand_hirek for select using (true);

-- ÍRNI senki nem írhat közvetlenül. Szándékosan nincs insert/update/delete
-- policy: csak a lenti két függvényen mehet, azok pedig PIN-t kérnek.
-- Enélkül a böngészőből bárki posztolhatna bármelyik stand nevében — a
-- táblát a letöltött JS-ből mindenki eléri az anon kulccsal.

-- ---------------------------------------------------------------------------
--  Üzenet kiírása az infótáblára
--
--  A stand a saját PIN-jével írhat, és csak a saját nevében. A PIN-t a
--  böngésző már ismeri (azzal lépett be), más standét nem.
-- ---------------------------------------------------------------------------
create or replace function post_stand_hir(
  p_exhibitor_id text,
  p_pin text,
  p_szoveg text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nev  text;
  v_sor  stand_hirek;
begin
  select name into v_nev
    from exhibitors
   where id = p_exhibitor_id
     and btrim(pin) = btrim(coalesce(p_pin, ''));

  if v_nev is null then
    -- Egy hibaszöveg mindkét esetre: ne lehessen belőle megtudni, hogy a
    -- stand nem létezik, vagy csak a PIN rossz.
    raise exception 'nincs jogosultsag';
  end if;

  if length(btrim(coalesce(p_szoveg, ''))) < 2 then
    raise exception 'ures uzenet';
  end if;

  insert into stand_hirek (exhibitor_id, szoveg)
  values (p_exhibitor_id, left(btrim(p_szoveg), 280))
  returning * into v_sor;

  return json_build_object(
    'id', v_sor.id,
    'exhibitor_id', v_sor.exhibitor_id,
    'szoveg', v_sor.szoveg,
    'created_at', v_sor.created_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
--  Üzenet visszavétele
--
--  Elírás, vagy már nem igaz. Csak a saját üzenetét veheti vissza a stand.
-- ---------------------------------------------------------------------------
create or replace function delete_stand_hir(p_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_db integer;
begin
  delete from stand_hirek h
   where h.id = p_id
     and exists (
       select 1 from exhibitors e
        where e.id = h.exhibitor_id
          and btrim(e.pin) = btrim(coalesce(p_pin, ''))
     );
  get diagnostics v_db = row_count;
  return v_db > 0;
end;
$$;

-- ---------------------------------------------------------------------------
--  Realtime: az új üzenet azonnal legyen ott minden telefonon
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stand_hirek'
  ) then
    alter publication supabase_realtime add table public.stand_hirek;
  end if;
end $$;

-- ---------------------------------------------------------------------------
--  Jogosultságok
--
--  A PUBLIC-tól kell megvonni, nem csak az anon-tól: a PostgreSQL minden új
--  funkcióra alapból a PUBLIC szerepnek adja a futtatási jogot, és az anon
--  annak tagja. Ez a szavazásnál egyszer már látszólagos tiltást okozott.
-- ---------------------------------------------------------------------------
revoke all on function post_stand_hir(text, text, text) from public;
revoke all on function delete_stand_hir(uuid, text) from public;
grant execute on function post_stand_hir(text, text, text) to anon, authenticated;
grant execute on function delete_stand_hir(uuid, text) to anon, authenticated;
