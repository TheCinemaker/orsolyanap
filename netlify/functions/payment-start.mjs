/**
 * POST /api/payment/start
 *
 * Adomány-tranzakció indítása. A fizetési módtól függően két külön SimplePay
 * API-t hív:
 *   card -> /payment/v2/start
 *   qvik -> /payment/rtp/start   (Request To Pay, NEM a /v2 alatt)
 *
 * Mindkettő `paymentUrl`-lel válaszol.
 */
import { ENDPOINTS, LOG_RAW_SIMPLEPAY_RESPONSE, assertConfig } from '../lib/config.js';
import { callSimplePay, generateOrderRef, SimplePayError } from '../lib/simplepay.js';
import { buildCardStartPayload, buildQvikStartPayload, extractStartResult } from '../lib/payloads.js';
import {
  parseAmount,
  parseEmail,
  parseLanguage,
  parseMethod,
  parseName,
  ValidationError,
} from '../lib/validation.js';
import { createTransaction, updateTransaction } from '../lib/store.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export default async (request) => {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Csak POST kérés fogadható.' }, 405);
  }

  try {
    assertConfig();

    const body = await request.json().catch(() => ({}));

    // 1) Bemenet ellenőrzése. Az összeghatárokat a szerver dönti el, nem a kliens.
    const amount = parseAmount(body.amount);
    const method = parseMethod(body.method);
    const customerEmail = parseEmail(body.email);
    const donorName = parseName(body.name);
    const language = parseLanguage(body.language);

    const orderRef = generateOrderRef('ORS');

    // 2) Rekord MÉG a SimplePay hívás előtt: egy azonnal beérkező IPN-nek is
    //    legyen mihez kapcsolódnia.
    await createTransaction({ orderRef, amount, method, customerEmail, donorName });

    // 3) Payload + végpont a mód szerint.
    const isQvik = method === 'qvik';

    const { payload, expiresAt } = isQvik
      ? buildQvikStartPayload({ orderRef, amount, customerEmail, language, customerName: donorName })
      : buildCardStartPayload({ orderRef, amount, customerEmail, language });

    const endpoint = isQvik ? ENDPOINTS.qvikStart : ENDPOINTS.cardStart;

    if (LOG_RAW_SIMPLEPAY_RESPONSE) {
      console.log('[start] %s | %s Ft | %s | %s', orderRef, amount, method, endpoint);
    }

    const response = await callSimplePay(endpoint, payload);
    const result = extractStartResult(response);

    if (!result.paymentUrl) {
      throw new SimplePayError('A SimplePay nem adott vissza fizetési linket.');
    }

    await updateTransaction(orderRef, {
      status: 'PENDING',
      transactionId: result.transactionId,
    });

    // 4) A kliens ebből dönt: mobilon átnavigál, asztali gépen QR-t rajzol belőle.
    return json({
      ok: true,
      method,
      orderRef,
      amount,
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return json({ ok: false, error: error.message, field: error.field }, 400);
    }

    if (error instanceof SimplePayError) {
      console.error('[start] SimplePay hiba: %s | kodok: %j', error.message, error.errorCodes);
      return json(
        {
          ok: false,
          error: 'A fizetési szolgáltató most nem érhető el. Kérlek, próbáld újra.',
          errorCodes: error.errorCodes,
        },
        502
      );
    }

    console.error('[start] Varatlan hiba: %s', error.stack || error.message);
    return json({ ok: false, error: 'Váratlan hiba történt.' }, 500);
  }
};

export const config = {
  path: '/api/payment/start',
};
