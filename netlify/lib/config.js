/**
 * Központi konfiguráció a Netlify Functions futtatókörnyezethez.
 *
 * Az értékek a Netlify környezeti változóiból jönnek (Site settings →
 * Environment variables). Lokálisan a `netlify dev` beolvassa a repo `.env`
 * fájlját is.
 *
 * FONTOS: itt SOHA nem használunk `VITE_` előtagú változót. Azok bekerülnek a
 * kliens bundle-be — a SimplePay titkos kulcs és a Supabase service role kulcs
 * kizárólag szerveroldalon létezhet.
 */

const toBool = (value, fallback = false) =>
  value === undefined ? fallback : /^(1|true|yes)$/i.test(String(value));

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stripSlash = (url) => String(url || '').replace(/\/+$/, '');

// ---------------------------------------------------------------------------
// SimplePay
// ---------------------------------------------------------------------------

export const SANDBOX = toBool(process.env.SIMPLEPAY_SANDBOX, true);

const HOST = SANDBOX ? 'https://sandbox.simplepay.hu' : 'https://secure.simplepay.hu';

export const ENDPOINTS = {
  /** Kártyás tranzakció indítása. */
  cardStart: `${HOST}/payment/v2/start`,
  /**
   * Qvik (Request To Pay) indítása.
   * Figyelem: NEM a /payment/v2 alatt van, hanem egy szinttel feljebb.
   */
  qvikStart: `${HOST}/payment/rtp/start`,
  /** Állapot-lekérdezés — az RTP tranzakciókat is megtalálja. */
  query: `${HOST}/payment/v2/query`,
};

export const MERCHANT = process.env.SIMPLEPAY_MERCHANT || 'PUBLICTESTHUF';
export const SECRET_KEY = process.env.SIMPLEPAY_SECRET_KEY || 'FxDa5w314kLlNseq2sKuVwaqZshZT5d6';

export const CURRENCY = 'HUF';
export const DEFAULT_LANGUAGE = 'HU';
export const SDK_VERSION = 'OrsolyaApp_Netlify_Donation_1.0.0';
export const TIMEZONE = 'Europe/Budapest';
export const CARD_METHODS = ['CARD'];

/**
 * A SimplePay fizetőoldal engedélyezett nyelvei. Ismeretlen kód esetén a
 * DEFAULT_LANGUAGE-re esünk vissza — a nyelv nem indokolja a fizetés
 * megtagadását.
 */
export const SUPPORTED_LANGUAGES = (process.env.SIMPLEPAY_LANGUAGES || 'HU,EN,DE')
  .split(',')
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);
export const PAYMENT_METHODS = ['card', 'qvik'];

// ---------------------------------------------------------------------------
// URL-ek
//
// A backend és a frontend ugyanazon a Netlify domainen él, ezért egy URL elég.
// A Netlify futás közben beállítja az URL változót; lokálisan a .env-ből jön.
// ---------------------------------------------------------------------------

export const SITE_URL = stripSlash(
  process.env.PUBLIC_SITE_URL || process.env.URL || 'http://localhost:8888'
);

export const BACK_URL = `${SITE_URL}/api/payment/back`;
export const IPN_URL = `${SITE_URL}/api/payment/ipn`;

// ---------------------------------------------------------------------------
// Üzleti szabályok
// ---------------------------------------------------------------------------

export const DONATION_MIN_HUF = toInt(process.env.DONATION_MIN_HUF, 500);
export const DONATION_MAX_HUF = toInt(process.env.DONATION_MAX_HUF, 1_000_000);
export const PAYMENT_TIMEOUT_MINUTES = toInt(process.env.PAYMENT_TIMEOUT_MINUTES, 30);

/**
 * A SimplePay kötelezően kér e-mail címet, a támogatótól viszont nem kérjük el.
 * Üres mező esetén ez a cím megy ki helyette.
 */
export const DONATION_FALLBACK_EMAIL =
  process.env.DONATION_FALLBACK_EMAIL || 'adomany@ktsze.hu';

export const LOG_RAW_SIMPLEPAY_RESPONSE = toBool(
  process.env.LOG_RAW_SIMPLEPAY_RESPONSE,
  SANDBOX
);

// ---------------------------------------------------------------------------
// Supabase (szerveroldali hozzáférés)
// ---------------------------------------------------------------------------

export const SUPABASE_URL = process.env.SUPABASE_URL || '';

/**
 * Service role kulcs: megkerüli az RLS-t, ezért KIZÁRÓLAG szerveroldalon
 * használható. A `donations` táblán nincs egyetlen policy sem, így az anon
 * kulccsal senki nem éri el — csak ez a kulcs.
 */
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ---------------------------------------------------------------------------
// Indulási ellenőrzés
// ---------------------------------------------------------------------------

export function assertConfig() {
  if (!MERCHANT || !SECRET_KEY) {
    throw new Error('Hiányzó SIMPLEPAY_MERCHANT vagy SIMPLEPAY_SECRET_KEY.');
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Hiányzó SUPABASE_URL vagy SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!SANDBOX) {
    if (MERCHANT === 'PUBLICTESTHUF') {
      throw new Error('Éles módban a sandbox merchant ID nem használható.');
    }
    if (!SITE_URL.startsWith('https://')) {
      throw new Error('Éles módban a PUBLIC_SITE_URL-nek https-nek kell lennie.');
    }
  }
}
