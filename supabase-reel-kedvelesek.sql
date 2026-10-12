-- ===========================================================================
--  Reel-kedvelések: egy készülék egy reelt egyszer, visszavonhatóan
--
--  Futtatás: Supabase -> SQL Editor -> beilleszt -> Run.
--  Újrafuttatható, nem bánt meglévő adatot.
--
--  Ugyanaz a séma, mint a szavazásnál: a napló az igazság, a reels.likes
--  oszlop csak gyorsítótár rajta. A különbség, hogy a kedvelés VISSZAVONHATÓ
--  -- az Instagramon is az, és a vendég ezt várja.
-- ===========================================================================

create table if not exists reel_likes (
  device_id  text not null,
  reel_id    text not null references reels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (device_id, reel_id)
);

create index if not exists reel_likes_reel_idx on reel_likes (reel_id);

alter table reel_likes enable row level security;
-- Szándékosan NINCS policy: a táblát csak a lenti security definer függvények
-- érik el. Enélkül a böngészőből bárki beszúrhatna ezer sort kitalált
-- készülékazonosítókkal, és a szám semmit nem jelentene.

-- ---------------------------------------------------------------------------
--  Kedvelés be/ki egy hívásban
--
--  Eddig a kliens a saját, esetleg elavult számából írt abszolút értéket:
--  két egyidejű kedvelés felülírta egymást, és egy oldalfrissítés után
--  ugyanaz a telefon újra kedvelhetett. Mostantól a napló dönt.
-- ---------------------------------------------------------------------------
create or replace function toggle_reel_like(p_reel_id text, p_device_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_likes integer;
  v_liked boolean;
begin
  if p_device_id is null or length(btrim(p_device_id)) < 8 then
    raise exception 'ervenytelen keszulekazonosito';
  end if;

  delete from reel_likes
   where device_id = btrim(p_device_id) and reel_id = p_reel_id;

  if found then
    v_liked := false;
  else
    insert into reel_likes (device_id, reel_id) values (btrim(p_device_id), p_reel_id);
    v_liked := true;
  end if;

  -- A szamot a naplobol szamoljuk, nem leptetjuk: igy akkor is helyes marad,
  -- ha az oszlopba korabban belenyultak.
  update reels
     set likes = (select count(*) from reel_likes l where l.reel_id = p_reel_id)
   where id = p_reel_id
   returning likes into v_likes;

  return json_build_object('likes', coalesce(v_likes, 0), 'liked', v_liked);
end;
$$;

-- Mit kedvelt mar ez a keszulek? Igy a sziv a tarolo torlese vagy masik
-- lapful utan is piros marad.
create or replace function reel_likes_by_device(p_device_id text)
returns setof text
language sql
security definer
set search_path = public
as $$
  select reel_id from reel_likes where device_id = btrim(p_device_id);
$$;

-- ---------------------------------------------------------------------------
--  Realtime: a kedvelések élőben látszódjanak
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reels'
  ) then
    alter publication supabase_realtime add table public.reels;
  end if;
end $$;

-- ---------------------------------------------------------------------------
--  Jogosultságok
--
--  A PUBLIC-tól kell megvonni, nem csak az anon-tól: a PostgreSQL minden új
--  funkcióra alapból a PUBLIC szerepnek adja a futtatási jogot, és az anon
--  annak tagja. A szavazásnál ez egyszer már látszólagos tiltást eredményezett.
-- ---------------------------------------------------------------------------
grant execute on function toggle_reel_like(text, text)   to anon, authenticated;
grant execute on function reel_likes_by_device(text)     to anon, authenticated;

-- A reels tábla likes oszlopát a böngésző ne írhassa közvetlenül: a kedvelés
-- csak a fenti függvényen mehet, különben a készülékenkénti korlát kikerülhető.
revoke update on table reels from anon;
grant update (caption, image, exhibitor_name) on table reels to anon;
