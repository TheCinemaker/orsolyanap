-- =====================================================================
-- ORSOLYA-NAPI VÁSÁR • KTSZE ADOMÁNYGYŰJTÉS — DONATIONS TÁBLA
-- Safe Schema Script: Does NOT drop tables or delete any existing data!
--
-- Futtatás: Supabase Dashboard → SQL Editor → beilleszt → Run
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.donations (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Saját megrendelés-azonosító, pl. ORS-MU3Z321X-F52113.
    -- Ez köti össze a SimplePay IPN-t a saját rekordunkkal, ezért egyedi.
    order_ref                TEXT UNIQUE NOT NULL,

    amount                   INTEGER NOT NULL CHECK (amount > 0),
    method                   TEXT NOT NULL CHECK (method IN ('card', 'qvik')),

    -- INIT -> PENDING -> SUCCESS | FAIL | CANCEL | TIMEOUT
    status                   TEXT NOT NULL DEFAULT 'INIT'
                             CHECK (status IN ('INIT','PENDING','SUCCESS','FAIL','CANCEL','TIMEOUT')),

    simplepay_transaction_id TEXT,

    -- A támogató nem köteles e-mailt megadni; ilyenkor az egyesület címe kerül ide.
    donor_email              TEXT,
    donor_name               TEXT,

    paid_at                  TIMESTAMPTZ,

    -- Mikor kérdeztük meg utoljára a SimplePay /query végpontját (polling throttle).
    last_query_at            TIMESTAMPTZ,

    -- A legutóbb feldolgozott IPN nyers tartalma — hibakereséshez.
    last_ipn                 JSONB,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donations_status_idx     ON public.donations (status);
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON public.donations (created_at DESC);

-- =====================================================================
-- BIZTONSÁG
--
-- Az RLS be van kapcsolva, és SZÁNDÉKOSAN nincs rajta egyetlen policy sem.
-- Emiatt az alkalmazás anon kulcsával senki nem tud olvasni és írni — a táblát
-- kizárólag a Netlify Functions éri el, a service role kulccsal, ami megkerüli
-- az RLS-t.
--
-- Ha később élő adományszámlálót szeretnél a nyilvános appban, NE nyiss policy-t
-- ezen a táblán: készíts helyette egy aggregált nézetet vagy egy külön táblát,
-- ami csak az összesített összeget tartalmazza, személyes adat nélkül.
-- =====================================================================

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- HASZNOS LEKÉRDEZÉSEK
-- =====================================================================

-- Eddig összegyűlt összeg:
--   SELECT COALESCE(SUM(amount), 0) AS osszesen
--   FROM public.donations WHERE status = 'SUCCESS';

-- Napi bontás:
--   SELECT date_trunc('day', paid_at) AS nap, COUNT(*), SUM(amount)
--   FROM public.donations WHERE status = 'SUCCESS'
--   GROUP BY 1 ORDER BY 1;

-- Fizetési mód szerint:
--   SELECT method, COUNT(*), SUM(amount)
--   FROM public.donations WHERE status = 'SUCCESS' GROUP BY method;
