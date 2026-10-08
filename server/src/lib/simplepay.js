/**
 * SimplePay v2 alacsony szintű kliens: aláírás-számítás, dátumformázás,
 * HTTP hívás.
 *
 * A LEGFONTOSABB SZABÁLY: az aláírást PONTOSAN azon a byte-sorozaton kell
 * számolni, amit el is küldünk (illetve amit megkaptunk). Ezért itt egyszer
 * készül el a JSON string, és azt küldjük ki nyers body-ként -- soha nem adjuk
 * át az objektumot az axios-nak újraszerializálásra, mert a kulcssorrend vagy
 * a whitespace eltérése azonnal érvénytelen aláírást eredményez.
 */
import crypto from 'node:crypto';
import axios from 'axios';

import {
  SECRET_KEY,
  TIMEZONE,
  LOG_RAW_SIMPLEPAY_RESPONSE,
} from '../config/simplepay.js';

/** A SimplePay által használt HTTP fejléc neve az aláíráshoz. */
export const SIGNATURE_HEADER = 'signature';

// ---------------------------------------------------------------------------
// Aláírás (HMAC-SHA384, base64)
// ---------------------------------------------------------------------------

/**
 * Aláírás képzése egy nyers (már szerializált) JSON stringre.
 *
 * @param {string} rawBody a kiküldött/kapott JSON pontos szövege
 * @param {string} [secret] kereskedői titkos kulcs
 * @returns {string} base64 kódolt HMAC-SHA384 lenyomat
 */
export function createSignature(rawBody, secret = SECRET_KEY) {
  return crypto
    .createHmac('sha384', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
}

/**
 * Beérkező aláírás ellenőrzése időzítéstámadás-biztos összehasonlítással.
 *
 * @param {string} rawBody a kapott nyers body
 * @param {string} receivedSignature a Signature fejléc értéke
 * @returns {boolean}
 */
export function verifySignature(rawBody, receivedSignature) {
  if (typeof receivedSignature !== 'string' || receivedSignature.length === 0) {
    return false;
  }

  const expected = Buffer.from(createSignature(rawBody), 'utf8');
  const received = Buffer.from(receivedSignature.trim(), 'utf8');

  // A timingSafeEqual azonos hosszt vár, ezért a hosszt előbb külön ellenőrizzük.
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

// ---------------------------------------------------------------------------
// Segédfüggvények
// ---------------------------------------------------------------------------

/** A SimplePay minden kéréshez egyedi, 32 karakteres salt-ot vár. */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex'); // 16 byte -> 32 hex karakter
}

/**
 * Egyedi, ember által is olvasható megrendelés-azonosító.
 * Formátum: ORS-<timestamp base36>-<random>, pl. ORS-LZ4K2P9-7F3A1C
 */
export function generateOrderRef(prefix = 'ORS') {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

/**
 * ISO 8601 dátum a SimplePay által várt formában, budapesti idő + offset.
 * Pl. "2026-09-16T14:35:00+02:00"
 *
 * Azért nem `toISOString()`, mert az UTC-t ad ("Z"), a SimplePay viszont a
 * kereskedői időzónát és a kiírt offsetet várja.
 *
 * @param {Date} date
 * @returns {string}
 */
export function toSimplePayDate(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );

  // "GMT+02:00" -> "+02:00"; nyári/téli időszámítást az Intl kezeli helyettünk.
  const offsetName =
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const offset = offsetName.replace('GMT', '') || '+00:00';

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

// ---------------------------------------------------------------------------
// HTTP hívás
// ---------------------------------------------------------------------------

export class SimplePayError extends Error {
  /**
   * @param {string} message
   * @param {{ errorCodes?: Array<number|string>, httpStatus?: number, raw?: string }} [details]
   */
  constructor(message, details = {}) {
    super(message);
    this.name = 'SimplePayError';
    this.errorCodes = details.errorCodes ?? [];
    this.httpStatus = details.httpStatus ?? null;
    this.raw = details.raw ?? null;
  }
}

/**
 * Hívás a SimplePay v2 API felé, aláírt kéréssel és a válasz aláírásának
 * ellenőrzésével.
 *
 * @param {string} endpoint teljes URL (lásd config ENDPOINTS)
 * @param {object} payload a kérés objektuma
 * @returns {Promise<object>} a válasz JSON objektuma
 */
export async function callSimplePay(endpoint, payload) {
  // 1) Egyszer szerializálunk -- ez a string megy ki ÉS ezt írjuk alá.
  const rawRequest = JSON.stringify(payload);
  const requestSignature = createSignature(rawRequest);

  let response;
  try {
    response = await axios.post(endpoint, rawRequest, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Signature: requestSignature,
      },
      // A választ NYERS szövegként kérjük, mert az aláírás a nyers byte-okra
      // vonatkozik. Ha az axios parse-olná és mi újraszerializálnánk, az
      // ellenőrzés hamis negatívot adna.
      transformResponse: [(data) => data],
      timeout: 20_000,
      // A SimplePay hibát is 200-as státusszal, errorCodes tömbbel adhat vissza,
      // de 4xx/5xx esetén is látni akarjuk a body-t.
      validateStatus: () => true,
    });
  } catch (error) {
    throw new SimplePayError(`SimplePay hálózati hiba: ${error.message}`);
  }

  const rawResponse = typeof response.data === 'string' ? response.data : String(response.data ?? '');

  if (LOG_RAW_SIMPLEPAY_RESPONSE) {
    console.log('[simplepay] <- HTTP %s %s', response.status, endpoint);
    console.log('[simplepay] <- raw body: %s', rawResponse);
  }

  // 2) Válasz aláírásának ellenőrzése (man-in-the-middle / hamisítás ellen).
  const responseSignature = response.headers?.[SIGNATURE_HEADER];
  const signatureValid = verifySignature(rawResponse, responseSignature);

  let parsed;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new SimplePayError('A SimplePay válasza nem érvényes JSON.', {
      httpStatus: response.status,
      raw: rawResponse,
    });
  }

  if (Array.isArray(parsed.errorCodes) && parsed.errorCodes.length > 0) {
    throw new SimplePayError(`SimplePay hiba: ${parsed.errorCodes.join(', ')}`, {
      errorCodes: parsed.errorCodes,
      httpStatus: response.status,
      raw: rawResponse,
    });
  }

  if (response.status < 200 || response.status >= 300) {
    throw new SimplePayError(`SimplePay HTTP ${response.status}`, {
      httpStatus: response.status,
      raw: rawResponse,
    });
  }

  if (!signatureValid) {
    // Sikeres tranzakciót SOHA nem fogadunk el érvénytelen aláírással.
    throw new SimplePayError('A SimplePay válasz aláírása érvénytelen.', {
      httpStatus: response.status,
      raw: rawResponse,
    });
  }

  return parsed;
}
