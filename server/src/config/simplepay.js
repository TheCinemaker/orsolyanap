/**
 * SimplePay v2 (OTP Mobil Kft.) központi konfiguráció.
 *
 * Minden környezetfüggő érték itt fut össze, hogy a sandbox -> éles váltás
 * egyetlen .env módosítás legyen, kódmódosítás nélkül.
 */
import 'dotenv/config';

/** "1" | "true" | "yes" -> true (case-insensitive) */
const toBool = (value, fallback = false) =>
  value === undefined ? fallback : /^(1|true|yes)$/i.test(String(value));

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stripTrailingSlash = (url) => String(url || '').replace(/\/+$/, '');

// ---------------------------------------------------------------------------
// Környezet
// ---------------------------------------------------------------------------

export const SANDBOX = toBool(process.env.SIMPLEPAY_SANDBOX, true);

const HOST = SANDBOX ? 'https://sandbox.simplepay.hu' : 'https://secure.simplepay.hu';

/** A kártyás (v2) API bázisa. */
const BASE_URL = `${HOST}/payment/v2`;

/** Az RTP/Qvik API bázisa -- egy szinttel a v2 FELETT. */
const RTP_BASE_URL = `${HOST}/payment`;

export const ENDPOINTS = {
  /** Kártyás tranzakció indítása */
  start: `${BASE_URL}/start`,
  /**
   * Qvik (azonnali átutalás) indítása.
   *
   * FIGYELEM: ez NEM a /payment/v2 alatt van, hanem egy szinttel feljebb,
   * és nincs benne `methods` mező -- ezért adott a v2 /start `methods: ["QVIK"]`
   * hívásra 5014-es hibát. A SimplePay ezt "Fizetési kérelem / Request To Pay
   * (RTP)" néven dokumentálja, külön fejlesztői doksiban és SDK-ban.
   *
   * A sandbox változatot leellenőriztük: a PUBLICTESTHUF fiókkal is működik.
   * Az éles útvonal ugyanennek a mintának a megfelelője (secure.simplepay.hu),
   * ezt élesítés előtt érdemes visszaigazoltatni a SimplePay-jel.
   */
  rtpStart: `${RTP_BASE_URL}/rtp/start`,
  /** Tranzakció állapotának lekérdezése (polling "source of truth") */
  query: `${BASE_URL}/query`,
  /** Visszatérítés */
  refund: `${BASE_URL}/refund`,
};

// ---------------------------------------------------------------------------
// Kereskedői azonosítók
//
// FIGYELEM: az alapértelmezett értékek a SimplePay NYILVÁNOS sandbox
// teszt-adatai. Éles üzemben KÖTELEZŐ .env-ből felülírni őket, és a
// secret key soha nem kerülhet a frontendbe vagy a git repóba.
// ---------------------------------------------------------------------------

export const MERCHANT = process.env.SIMPLEPAY_MERCHANT || 'PUBLICTESTHUF';
export const SECRET_KEY = process.env.SIMPLEPAY_SECRET_KEY || 'FxDa5w314kLlNseq2sKuVwaqZshZT5d6';

/** A SimplePay merchant-fiók devizája. Egy fiók = egy deviza. */
export const CURRENCY = 'HUF';

/** Tetszőleges, az integrációt azonosító string. Hibakeresésnél a SimplePay ezt látja. */
export const SDK_VERSION = 'OrsolyaApp_Node_Donation_1.0.0';

/**
 * A SimplePay fizetooldal alapertelmezett nyelve.
 *
 * Rendezvenyen kulfoldi latogato is fizethet kartyaval, ezert a nyelv
 * keresenkent felulirhato -- ez csak a tartalek ertek.
 */
export const DEFAULT_LANGUAGE = 'HU';

/**
 * Engedelyezett nyelvkodok. A SimplePay tobbet is tamogat (a teljes listat a
 * sajat dokumentaciod tartalmazza); itt azok szerepelnek, amiknek a kozeli
 * hataron atjaro latogatoknal ertelme van. Bovitheto.
 */
export const SUPPORTED_LANGUAGES = (process.env.SIMPLEPAY_LANGUAGES || 'HU,EN,DE')
  .split(',')
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);

/** A SimplePay dátummezői Budapest-idő + offset formátumot várnak. */
export const TIMEZONE = 'Europe/Budapest';

// ---------------------------------------------------------------------------
// URL-ek
// ---------------------------------------------------------------------------

export const PUBLIC_BACKEND_URL = stripTrailingSlash(
  process.env.PUBLIC_BACKEND_URL || 'http://localhost:4000'
);

export const PUBLIC_FRONTEND_URL = stripTrailingSlash(
  process.env.PUBLIC_FRONTEND_URL || 'http://localhost:5173'
);

/** Ide dobja vissza a SimplePay a böngészőt a fizetés végén (GET, r + s query paraméterrel). */
export const BACK_URL = `${PUBLIC_BACKEND_URL}/api/payment/back`;

/** Ide küldi a SimplePay a szerver-szerver értesítést (IPN). A merchant fiókban is be kell állítani! */
export const IPN_URL = `${PUBLIC_BACKEND_URL}/api/payment/ipn`;

export const CORS_ORIGINS = (process.env.CORS_ORIGINS || PUBLIC_FRONTEND_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ---------------------------------------------------------------------------
// Üzleti szabályok
// ---------------------------------------------------------------------------

export const DONATION_MIN_HUF = toInt(process.env.DONATION_MIN_HUF, 500);
export const DONATION_MAX_HUF = toInt(process.env.DONATION_MAX_HUF, 1_000_000);
export const PAYMENT_TIMEOUT_MINUTES = toInt(process.env.PAYMENT_TIMEOUT_MINUTES, 30);

/**
 * A SimplePay KOTELEZOEN ker customerEmail-t (nelkule 5219-es hibaval elutasit),
 * de barmilyen ervenyes cim megfelel neki -- ezt a sandboxon leellenoriztuk.
 *
 * Adomanynal a pultnal nem keruk el a tamogato e-mail cimet: minden begepelt
 * karakter ido. Helyette az egyesulet sajat cime megy ki. Ha a tamogato megis
 * ad meg cimet (pl. visszaigazolast ker), az elsobbseget elvez.
 */
export const DONATION_FALLBACK_EMAIL =
  process.env.DONATION_FALLBACK_EMAIL || 'adomany@ktsze.hu';

// ---------------------------------------------------------------------------
// Fizetési módok
//
// A kártyás ág a v2 /start végpontot használja `methods: ["CARD"]` mezővel.
// A Qvik ág a külön RTP végpontot, ahol NINCS `methods` mező.
// ---------------------------------------------------------------------------

export const CARD_METHODS = ['CARD'];

/** A kliens által választható fizetési módok. */
export const PAYMENT_METHODS = ['card', 'qvik'];

export const LOG_RAW_SIMPLEPAY_RESPONSE = toBool(
  process.env.LOG_RAW_SIMPLEPAY_RESPONSE,
  SANDBOX
);

// ---------------------------------------------------------------------------
// Indulási ellenőrzés
// ---------------------------------------------------------------------------

export function assertConfig() {
  if (!MERCHANT || !SECRET_KEY) {
    throw new Error('[simplepay] SIMPLEPAY_MERCHANT és SIMPLEPAY_SECRET_KEY kötelező.');
  }
  if (!SANDBOX) {
    if (MERCHANT === 'PUBLICTESTHUF') {
      throw new Error('[simplepay] Éles módban a sandbox merchant ID nem használható.');
    }
    if (!PUBLIC_BACKEND_URL.startsWith('https://')) {
      throw new Error('[simplepay] Éles módban a PUBLIC_BACKEND_URL-nek https-nek kell lennie.');
    }
  }
}
