-- =====================================================================
-- ÁRPÁD-HÁZI SZENT MARGIT ÓVODA STAND ÉS KÍNÁLAT SUPABASE BETÖLTŐ SCRIPT
-- =====================================================================
-- Futtatás: Supabase Dashboard → SQL Editor → Új lekérdezés (New query) → Beillesztés → Run
-- Safe script: ha már létezik az ID, felülírja / meglévőt frissíti (UPSERT)
-- =====================================================================

-- 1. KIÁLLÍTÓ (STAND) BESZÚRÁSA / FRISSÍTÉSE
INSERT INTO public.exhibitors (
    id,
    name,
    location,
    coordinates,
    pin,
    category,
    has_drinks,
    offerings,
    days,
    is_open,
    story,
    notice,
    image
)
VALUES (
    'arpad-hazi-szent-margit-ovoda',
    'Árpád-házi Szent Margit Óvoda',
    'Diáksétány',
    '[47.38988, 16.53895]'::jsonb,
    '4832', -- Kiállítói PIN kód a műszerfalra történő belépéshez
    'meleg_etel',
    false,
    'Pásztortarhonya, Pásztorok húsos-babos káposztája, Kézműves termékek, Sütemények, Zsákbamacska',
    'both',
    true,
    '„Gyere, kóstold meg a Csillagszemű juhász kedvenceit!”',
    'Szombaton a főétel mellé egy bojtárkupon is jár, amellyel a látogatók a külső várárokban kiállhatják a 3 próbát.',
    '/logok/szent-margit-ovoda.jpg'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    pin = EXCLUDED.pin,
    story = EXCLUDED.story,
    notice = EXCLUDED.notice,
    offerings = EXCLUDED.offerings,
    image = EXCLUDED.image;


-- 2. ÉTELEK ÉS KÍNÁLAT BESZÚRÁSA / FRISSÍTÉSE
-- Töröljük a stand korábbi tételeit az újrafuttathatóság érdekében
DELETE FROM public.menu_items WHERE exhibitor_id = 'arpad-hazi-szent-margit-ovoda';

INSERT INTO public.menu_items (
    exhibitor_id,
    name,
    description,
    category,
    available_day,
    tags,
    image,
    initial_stock,
    stock,
    status
)
VALUES
(
    'arpad-hazi-szent-margit-ovoda',
    'Pásztortarhonya',
    'Szombaton a főétel mellé bojtárkupon jár (3 próba a külső várárokban)',
    'meleg_etel',
    'saturday',
    ARRAY['tarhonya', 'pásztor', 'magyaros', 'házias'],
    '/etelek/pasztortarhonya.png',
    50, 50, 'ready'
),
(
    'arpad-hazi-szent-margit-ovoda',
    'Pásztorok húsos-babos káposztája',
    NULL,
    'meleg_etel',
    'sunday',
    ARRAY['káposzta', 'bab', 'húsos', 'magyaros', 'házias'],
    '/etelek/baboskaposzta.png',
    50, 50, 'ready'
),
(
    'arpad-hazi-szent-margit-ovoda',
    'Kézműves termékek',
    NULL,
    'egyeb',
    'both',
    ARRAY['kézműves', 'vásár'],
    '/etelek/kezmuves.png',
    50, 50, 'ready'
),
(
    'arpad-hazi-szent-margit-ovoda',
    'Sütemények, finomságok',
    NULL,
    'sutemeny',
    'both',
    ARRAY['sütemény', 'édes', 'házi'],
    '/etelek/sutemeny.png',
    50, 50, 'ready'
),
(
    'arpad-hazi-szent-margit-ovoda',
    'Zsákbamacska',
    NULL,
    'egyeb',
    'both',
    ARRAY['játék', 'nyeremény'],
    '/etelek/zsakbamacska.png',
    50, 50, 'ready'
),
(
    'arpad-hazi-szent-margit-ovoda',
    '18+ zsákbamacska',
    NULL,
    'egyeb',
    'both',
    ARRAY['játék', 'felnőtt', 'nyeremény'],
    '/etelek/18plusz-zsakbamacska.png',
    50, 50, 'ready'
);
