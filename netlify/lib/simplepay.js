/**
 * SimplePay alacsony szintű kliens: aláírás, dátum, HTTP hívás.
 *
 * A Node beépített `fetch`-ét használja, hogy a függvény-csomagba ne kelljen
 * HTTP könyvtárat bundle-ölni — a hidegindítás minden kilobyte-ot megérez.
 *
 * A LEGFONTOSABB SZABÁLY: az aláírást PONTOSAN azon a byte-sorozaton kell
 * számolni, amit elküldünk (illetve amit megkaptunk). Ezért egyszer készül el
 * a JSON string, és azt küldjük ki nyers body-ként.
 */
import crypto from 'node:crypto';

import { SECRET_KEY, TIMEZONE, LOG_RAW_SIMPLEPAY_RESPONSE } from './config.js';

/**
 * HMAC-SHA384 aláírás base64-ben.
 *
 * @param {string} rawBody
 * @param {string} [secret]
 * @returns {string}
 */
export function createSignature(rawBody, secret = SECRET_KEY) {
  return crypto.createHmac('sha384', secret).update(rawBody, 'utf8').digest('base64');
}

/**
 * Beérkező aláírás ellenőrzése időzítéstámadás-biztos összehasonlítással.
 *
 * @param {string} rawBody
 * @param {string|null|undefined} receivedSignature
 * @returns {boolean}
 */
export function verifySignature(rawBody, receivedSignature) {
  if (typeof receivedSignature !== 'string' || receivedSignature.length === 0) return false;

  const expected = Buffer.from(createSignature(rawBody), 'utf8');
  const received = Buffer.from(receivedSignature.trim(), 'utf8');

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

/** A SimplePay minden kéréshez egyedi, 32 karakteres salt-ot vár. */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Egyedi megrendelés-azonosító, pl. ORS-MU3Z321X-F52113
 *
 * @param {string} [prefix]
 * @returns {string}
 */
export function generateOrderRef(prefix = 'ORS') {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

/**
 * ISO 8601 dátum budapesti idővel és kiírt offsettel, pl.
 * "2026-09-16T14:35:00+02:00".
 *
 * Azért nem `toISOString()`, mert az UTC-t ad ("Z"), a SimplePay viszont a
 * kereskedői időzónát várja. A nyári időszámítást az Intl kezeli.
 *
 * @param {Date} [date]
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

  const offsetName =
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const offset = offsetName.replace('GMT', '') || '+00:00';

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

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
 * Aláírt hívás a SimplePay felé, a válasz aláírásának ellenőrzésével.
 *
 * @param {string} endpoint
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function callSimplePay(endpoint, payload) {
  // Egyszer szerializálunk: ez a string megy ki ÉS ezt írjuk alá.
  const rawRequest = JSON.stringify(payload);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Signature: createSignature(rawRequest),
      },
      body: rawRequest,
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new SimplePayError(`SimplePay hálózati hiba: ${error.message}`);
  }

  // A választ NYERS szövegként olvassuk: az aláírás a nyers byte-okra vonatkozik.
  const rawResponse = await response.text();

  if (LOG_RAW_SIMPLEPAY_RESPONSE) {
    console.log('[simplepay] <- HTTP %s %s', response.status, endpoint);
    console.log('[simplepay] <- raw: %s', rawResponse);
  }

  const signatureValid = verifySignature(rawResponse, response.headers.get('signature'));

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

  if (!response.ok) {
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

/**
 * A SimplePay részletes státuszainak leképezése a saját állapotgépünkre.
 *
 * @param {string} simplePayStatus
 * @returns {'PENDING'|'SUCCESS'|'FAIL'|'CANCEL'|'TIMEOUT'}
 */
export function mapSimplePayStatus(simplePayStatus) {
  switch (String(simplePayStatus || '').toUpperCase()) {
    case 'FINISHED':
    case 'AUTHORIZED':
      return 'SUCCESS';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCEL';
    case 'TIMEOUT':
      return 'TIMEOUT';
    case 'NOTAUTHORIZED':
    case 'FRAUD':
    case 'INFRAUD':
    case 'REVERSED':
      return 'FAIL';
    default:
      // INIT, INPAYMENT és minden ismeretlen érték: még nincs végállapot.
      return 'PENDING';
  }
}

/**
 * Egy rendelés állapota közvetlenül a SimplePay-től.
 *
 * Az IPN az elsődleges, push alapú csatorna; ez a tartalék, ha az elveszne.
 *
 * @param {string} orderRef
 * @param {string} queryEndpoint
 * @param {string} merchant
 * @returns {Promise<{ status: string, transactionId: string|null }>}
 */
export async function queryTransactionStatus(orderRef, queryEndpoint, merchant) {
  const response = await callSimplePay(queryEndpoint, {
    salt: generateSalt(),
    merchant,
    orderRefs: [orderRef],
    detailed: true,
  });

  const transaction = Array.isArray(response.transactions)
    ? (response.transactions.find((item) => item.orderRef === orderRef) ?? response.transactions[0])
    : null;

  if (!transaction) return { status: 'PENDING', transactionId: null };

  return {
    status: mapSimplePayStatus(transaction.status),
    transactionId: transaction.transactionId != null ? String(transaction.transactionId) : null,
  };
}
