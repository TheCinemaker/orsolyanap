-- =====================================================================
-- ORSOLYA-NAPI VÁSÁR • CIVIL ÍZEK UTCÁJA — SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor (https://supabase.com)
-- =====================================================================

-- 1. Create Tables

-- Exhibitors (Árusok & Standok)
CREATE TABLE IF NOT EXISTS public.exhibitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    coordinates JSONB DEFAULT '[47.38988, 16.53895]'::jsonb,
    pin TEXT NOT NULL DEFAULT '1234',
    category TEXT DEFAULT 'meleg_etel',
    has_drinks BOOLEAN DEFAULT false,
    offerings TEXT,
    is_open BOOLEAN DEFAULT true,
    story TEXT,
    cause TEXT,
    phone TEXT,
    image TEXT,
    notice TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items / Dishes (Ételek Katalógusa)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exhibitor_id TEXT REFERENCES public.exhibitors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    initial_stock INTEGER DEFAULT 30,
    stock INTEGER DEFAULT 30,
    status TEXT DEFAULT 'ready', -- 'ready' | 'cooking' | 'sold_out'
    votes INTEGER DEFAULT 0,
    category TEXT DEFAULT 'meleg_etel', -- 'meleg_etel' | 'hideg_etel' | 'sutemeny' | 'street_food' | 'italok' | 'egyeb'
    tags TEXT[] DEFAULT '{}',
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes (Közönségszavazás követése)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
    device_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-orders / Foglalások (ha szükséges)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT 'ORD-' || floor(extract(epoch from now())::numeric),
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    exhibitor_id TEXT REFERENCES public.exhibitors(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    pickup_time TEXT,
    status TEXT DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for High-Speed Filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_exhibitor ON public.menu_items(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_exhibitors_category ON public.exhibitors(category);
CREATE INDEX IF NOT EXISTS idx_exhibitors_drinks ON public.exhibitors(has_drinks);

-- 3. Row Level Security (RLS) & Public Policies
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Public exhibitors access" ON public.exhibitors FOR SELECT USING (true);
CREATE POLICY "Public menu_items access" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Public votes read access" ON public.votes FOR SELECT USING (true);

-- Allow Public Updates (for exhibitor dashboard PIN auth & public voting)
CREATE POLICY "Public exhibitors update" ON public.exhibitors FOR UPDATE USING (true);
CREATE POLICY "Public exhibitors insert" ON public.exhibitors FOR INSERT WITH CHECK (true);

CREATE POLICY "Public menu_items update" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Public menu_items insert" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public menu_items delete" ON public.menu_items FOR DELETE USING (true);

CREATE POLICY "Public votes insert" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders access" ON public.orders FOR ALL USING (true);

-- 4. Enable Supabase Realtime Subscriptions
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.exhibitors, public.menu_items;
COMMIT;

-- 5. Seed Initial Exhibitor Data (Standok)
INSERT INTO public.exhibitors (id, name, location, pin, category, has_drinks, offerings, story, cause, phone, image, notice)
VALUES 
('ex-1', 'Jurisics Vár Bográcsozója', 'Diáksétány 1. (Vár felőli bejárat)', '1234', 'meleg_etel', false, 'Bográcsos marhapörkölt, szüretes gulyásleves, tejfölös babgulyás, csülkös pacal', 'Kőszegi hagyományőrző baráti társaság vagyunk. Minden évben szabad tűzön, eredeti vasi receptek alapján főzünk a Diáksétányon.', 'A kőszegi gyermekmentők és a helyi cserkészcsapat javára gyűjtünk adományokat.', '+36 94 563 100', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', 'A marhapörkölt frissen rotyog a Diáksétányon!'),
('ex-2', 'Kőszegi Borosgazdák Egyesülete', 'Diáksétány 3. (Gyöngyös-patak hídjánál)', '2345', 'italok', true, 'Kőszegi Kékfrankos borok, forró fűszeres forralt bor, friss szőlőmust, borpárlat', 'A Kőszegi Hegyközség szőlősgazdái. A kőszegi Kékfrankos és a helyi borkultúra ápolása a szívügyünk.', 'A kőszegi szőlőjövő és a történelmi szőlőskert felújítására gyűjtünk.', '+36 30 998 7654', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', 'Forró fűszeres forralt bor és friss szőlőmust kapható a patakparton!'),
('ex-3', 'Pékegér & Kőszegi Rétesház', 'Diáksétány 5. (Központi sétány)', '3456', 'sutemeny', true, 'Házi meggyes-mákos rétes, vasi tökös-mákos rétes, kézműves pogácsa, meleg almalé', 'Kézműves családi pékség. Dédszüleink receptjei alapján, kézzel nyújtott tésztából sütjük a kőszegi réteseket.', 'A helyi kézműves hagyományőrző iskola javára.', '+36 30 445 1122', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 'Friss meleg meggyes-mákos rétes a kemencéből!'),
('ex-4', 'Kőszegi Kürtőskalács & Kávézó', 'Diáksétány 8. (Park felőli oldal)', '4567', 'street_food', true, 'Faszénen sült diós és fahéjas kürtőskalács, eszpresszó, cappuccino, forró csoki', 'Hagyományos faszénparázson sült kürtőskalácsok mesterei.', 'Gyermeknevelési alapítvány támogatása.', '+36 20 334 5566', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', 'Friss meleg kürtőskalács sütés és forró kávé folyamatosan!'),
('ex-5', 'Vasi Vadászok & Erdészklub', 'Diáksétány 12. (Színpad mellett)', '5678', 'meleg_etel', false, 'Erdei gombás szarvaspörkölt dödöllével, tepsis vasi dödölle pirított hagymával', 'A Kőszegi-hegység erdészei és vadászai. Kőszegi erdei gombákkal és vadételekkel várunk mindenkit.', 'Az erdei tanösvények és vadrezervátum támogatására.', '+36 30 777 8899', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 'Erdei szarvaspörkölt dödöllével kész a Színpad mellett!'),
('ex-6', 'Írott-kő Sajt- & Mézkészítők', 'Diáksétány 15. (Várpark sétány)', '6789', 'hideg_etel', false, 'Bükki és kőszegi kézműves sajtok, fűszeres sajtgolyók, akácméz, erdei méz', 'Alpokaljai családi gazdaság. Natúrparki kézműves sajtokat és erdei mézeket kóstoltatunk.', 'A helyi méhészeti egyesület támogatására.', '+36 94 360 220', 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80', 'Kézműves sajtkóstoló friss kőszegi kenyérrel!')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    offerings = EXCLUDED.offerings,
    category = EXCLUDED.category,
    has_drinks = EXCLUDED.has_drinks;

-- 6. Seed Initial Menu Items Data (Ételek Katalógusa)
INSERT INTO public.menu_items (id, exhibitor_id, name, description, initial_stock, stock, status, votes, category, tags, image)
VALUES
('item-101', 'ex-1', 'Bográcsos Marhapörkölt Tarhonyával', 'Szabad tűzön, vörösborral és kőszegi fűszerpaprikával főzött szaftos marhapörkölt, házi tarhonyával.', 50, 42, 'ready', 42, 'meleg_etel', ARRAY['Meleg ételek', 'Bográcsos', 'Pörkölt'], 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'),
('item-102', 'ex-1', 'Kőszegi Szüretes Gulyásleves', 'Gazdag gulyásleves füstölt csülökkel, házi csipetkével és friss kőszegi kenyérrel.', 40, 38, 'ready', 38, 'meleg_etel', ARRAY['Meleg ételek', 'Gulyás', 'Leves'], 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'),
('item-201', 'ex-2', 'Fűszeres Forralt Kékfrankos', 'Minőségi kőszegi Kékfrankos bor narancshéjjal, fahéjjal és szegfűszeggel melegítve.', 100, 85, 'ready', 35, 'italok', ARRAY['Italok', 'Forralt bor', 'Kékfrankos'], 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'),
('item-202', 'ex-2', 'Friss Kőszegi Szőlőmust', 'Alkoholmentes, frissen préselt édes Kőszegi Kékfrankos szőlőlé.', 60, 52, 'ready', 19, 'italok', ARRAY['Italok', 'Must', 'Alkoholmentes'], 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'),
('item-301', 'ex-3', 'Házi Meggyes-Mákos Rétes', 'Kézzel nyújtott vékony tészta, bőséges meggyes-mákos töltelékkel.', 60, 51, 'ready', 51, 'sutemeny', ARRAY['Sütemény', 'Meggyes rétes', 'Házi'], 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'),
('item-401', 'ex-4', 'Diós Kürtőskalács', 'Faszénfelett forgatott, karamellizált dióburokban.', 50, 31, 'ready', 31, 'street_food', ARRAY['Street Food', 'Kürtőskalács'], 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'),
('item-501', 'ex-5', 'Erdei Gombás Szarvaspörkölt Dödöllével', 'Kőszegi erdei gombákkal párolt szarvascomb, serpenyőben pirított vasi dödöllével.', 50, 47, 'ready', 47, 'meleg_etel', ARRAY['Meleg ételek', 'Dödölle', 'Szarvas'], 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'),
('item-601', 'ex-6', 'Írott-kő Kézműves Sajttál', 'Bükki és kőszegi érlelt sajtok variációja házi mézzel és dióval.', 40, 27, 'ready', 27, 'hideg_etel', ARRAY['Hideg ételek', 'Sajt', 'Helyi'], 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category;
