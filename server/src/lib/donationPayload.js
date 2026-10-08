/**
 * A SimplePay kérés-payloadok összeállítása.
 *
 * A két fizetési mód KÉT KÜLÖN API-t használ, eltérő mezőkkel:
 *
 *   kártya -> POST /payment/v2/start    (methods: ["CARD"], timeout mező)
 *   Qvik   -> POST /payment/rtp/start   (nincs methods, deadline + customer mező)
 *
 * A Qvik a SimplePay dokumentációjában "Fizetési kérelem / Request To Pay (RTP)"
 * néven szerepel. Mindkettő ugyanazt a HMAC-SHA384 aláírást használja, és
 * mindkettő `paymentUrl`-lel válaszol.
 */
import {
  MERCHANT,
  CURRENCY,
  DEFAULT_LANGUAGE,
  SDK_VERSION,
  CARD_METHODS,
  BACK_URL,
  PAYMENT_TIMEOUT_MINUTES,
} from '../config/simplepay.js';
import { generateSalt, toSimplePayDate } from './simplepay.js';

/**
 * Minden kérésben azonos alapmezők.
 *
 * @param {{ orderRef: string, amount: number, customerEmail: string, language?: string }} params
 */
function commonFields({ orderRef, amount, customerEmail, language }) {
  return {
    salt: generateSalt(),
    merchant: MERCHANT,
    orderRef,
    currency: CURRENCY,
    customerEmail,
    language: language || DEFAULT_LANGUAGE,
    sdkVersion: SDK_VERSION,
    // A SimplePay stringként várja az összeget. HUF-nál nincs tizedes.
    total: String(amount),
    url: BACK_URL,
  };
}

/**
 * Kártyás fizetés payloadja a v2 /start végponthoz.
 *
 * @param {{ orderRef: string, amount: number, customerEmail: string, language?: string, invoice?: object }} params
 * @returns {{ payload: object, expiresAt: Date }}
 */
export function buildCardStartPayload({ orderRef, amount, customerEmail, language, invoice }) {
  const expiresAt = new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

  const payload = {
    ...commonFields({ orderRef, amount, customerEmail, language }),
    methods: CARD_METHODS,
    timeout: toSimplePayDate(expiresAt),
  };

  // Adománynál nincs számlázás, ezért alapesetben semmilyen számlázási mezőt
  // nem küldünk: minden extra lépés a fizetőoldalon időt vesz el.
  if (invoice) {
    payload.invoice = invoice;
  }

  return { payload, expiresAt };
}

/**
 * Qvik (azonnali átutalás) payloadja az /rtp/start végponthoz.
 *
 * Eltérések a kártyáshoz képest:
 *   - nincs `methods` mező (ettől kapna 5014-et a v2 /start)
 *   - `timeout` helyett `deadline`
 *   - `customer` (név) és `additionalInfo` (a banki appban megjelenő közlemény)
 *
 * @param {{ orderRef: string, amount: number, customerEmail: string, language?: string, customerName?: string, info?: string }} params
 * @returns {{ payload: object, expiresAt: Date }}
 */
export function buildQvikStartPayload({
  orderRef,
  amount,
  customerEmail,
  language,
  customerName,
  info,
}) {
  const expiresAt = new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

  const payload = {
    ...commonFields({ orderRef, amount, customerEmail, language }),
    deadline: toSimplePayDate(expiresAt),
    customer: customerName || 'Támogató',
    // Ez a szöveg jelenik meg a támogató banki alkalmazásában.
    additionalInfo: info || 'KTSZE adomány',
  };

  return { payload, expiresAt };
}

/**
 * A válaszból kinyeri a frontendnek szükséges adatokat.
 *
 * Mindkét ág `paymentUrl`-t ad vissza. A Qvik QR-kódot és a banki app
 * megnyitását a SimplePay a SAJÁT fizetőoldalán intézi -- nyers QR stringet
 * és deep linket az API nem ad vissza, ezért nem is rajzolunk sajátot.
 *
 * @param {object} response
 * @returns {{ transactionId: string|null, paymentUrl: string|null }}
 */
export function extractStartResult(response) {
  return {
    transactionId: response.transactionId != null ? String(response.transactionId) : null,
    paymentUrl: typeof response.paymentUrl === 'string' ? response.paymentUrl : null,
  };
}
