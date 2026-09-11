-- =====================================================================
-- ORSOLYA-NAPI VÁSÁR • CIVIL ÍZEK UTCÁJA — SUPABASE DATABASE SCHEMA
-- Safe Schema Script: Does NOT drop tables or delete any existing data!
-- =====================================================================

-- Exhibitors (Árusok & Csapatok)
CREATE TABLE IF NOT EXISTS public.exhibitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Diáksétány',
    coordinates JSONB DEFAULT '[47.38988, 16.53895]'::jsonb,
    pin TEXT NOT NULL DEFAULT '1234',
    category TEXT DEFAULT 'meleg_etel',
    has_drinks BOOLEAN DEFAULT false,
    offerings TEXT NOT NULL,
    days TEXT DEFAULT 'both',
    is_open BOOLEAN DEFAULT true,
    story TEXT,
    cause TEXT,
    phone TEXT,
    email TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    image TEXT,
    notice TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items / Dishes (Ételek & Kínálat)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exhibitor_id TEXT REFERENCES public.exhibitors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    initial_stock INTEGER DEFAULT 30,
    stock INTEGER DEFAULT 30,
    status TEXT DEFAULT 'ready',
    votes INTEGER DEFAULT 0,
    category TEXT DEFAULT 'meleg_etel',
    available_day TEXT DEFAULT 'both',
    is_gluten_free BOOLEAN DEFAULT false,
    is_lactose_free BOOLEAN DEFAULT false,
    is_sugar_free BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    price TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure is_hidden column exists if schema was created previously
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Votes (Közönségszavazás követése)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
    device_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Reels / Stories (Orsolya REELS)
CREATE TABLE IF NOT EXISTS public.reels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exhibitor_id TEXT REFERENCES public.exhibitors(id) ON DELETE CASCADE,
    exhibitor_name TEXT NOT NULL,
    caption TEXT NOT NULL,
    image TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-orders / Foglalások
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

-- Indexes for High-Speed Filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_exhibitor ON public.menu_items(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_allergens ON public.menu_items(is_gluten_free, is_lactose_free, is_sugar_free, is_vegan);
CREATE INDEX IF NOT EXISTS idx_exhibitors_days ON public.exhibitors(days);
CREATE INDEX IF NOT EXISTS idx_reels_exhibitor ON public.reels(exhibitor_id);

-- Enable Row Level Security
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to prevent 42710 "already exists" errors
DROP POLICY IF EXISTS "Public exhibitors access" ON public.exhibitors;
DROP POLICY IF EXISTS "Public menu_items access" ON public.menu_items;
DROP POLICY IF EXISTS "Public reels access" ON public.reels;
DROP POLICY IF EXISTS "Public votes read access" ON public.votes;
DROP POLICY IF EXISTS "Public exhibitors update" ON public.exhibitors;
DROP POLICY IF EXISTS "Public exhibitors insert" ON public.exhibitors;
DROP POLICY IF EXISTS "Public exhibitors delete" ON public.exhibitors;
DROP POLICY IF EXISTS "Public menu_items update" ON public.menu_items;
DROP POLICY IF EXISTS "Public menu_items insert" ON public.menu_items;
DROP POLICY IF EXISTS "Public menu_items delete" ON public.menu_items;
DROP POLICY IF EXISTS "Public reels insert" ON public.reels;
DROP POLICY IF EXISTS "Public reels update" ON public.reels;
DROP POLICY IF EXISTS "Public reels delete" ON public.reels;
DROP POLICY IF EXISTS "Public votes insert" ON public.votes;
DROP POLICY IF EXISTS "Public orders access" ON public.orders;

-- Re-create Safe Public Access Policies
CREATE POLICY "Public exhibitors access" ON public.exhibitors FOR SELECT USING (true);
CREATE POLICY "Public menu_items access" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Public reels access" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Public votes read access" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Public exhibitors update" ON public.exhibitors FOR UPDATE USING (true);
CREATE POLICY "Public exhibitors insert" ON public.exhibitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public exhibitors delete" ON public.exhibitors FOR DELETE USING (true);
CREATE POLICY "Public menu_items update" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Public menu_items insert" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public menu_items delete" ON public.menu_items FOR DELETE USING (true);
CREATE POLICY "Public reels insert" ON public.reels FOR INSERT WITH CHECK (true);
CREATE POLICY "Public reels update" ON public.reels FOR UPDATE USING (true);
CREATE POLICY "Public reels delete" ON public.reels FOR DELETE USING (true);
CREATE POLICY "Public votes insert" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders access" ON public.orders FOR ALL USING (true);

-- Enable Supabase Realtime Subscriptions
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.exhibitors, public.menu_items, public.reels;
COMMIT;
