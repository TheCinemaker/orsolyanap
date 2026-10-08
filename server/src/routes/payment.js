/**
 * Fizetési végpontok:
 *   POST /api/payment/start            -- tranzakció indítása (card | qvik)
 *   GET  /api/payment/status/:orderRef -- állapot lekérdezés (frontend polling)
 *   GET  /api/payment/back             -- SimplePay böngésző-visszairányítás
 *   GET  /api/payment/config           -- összeghatárok a frontendnek
 */
import express from 'express';

import {
  ENDPOINTS,
  PUBLIC_FRONTEND_URL,
  DONATION_MIN_HUF,
  DONATION_MAX_HUF,
  LOG_RAW_SIMPLEPAY_RESPONSE,
} from '../config/simplepay.js';
import {
  callSimplePay,
  createSignature,
  generateOrderRef,
  SimplePayError,
} from '../lib/simplepay.js';
import {
  buildCardStartPayload,
  buildQvikStartPayload,
  extractStartResult,
} from '../lib/donationPayload.js';
import { queryTransactionStatus } from '../lib/statusQuery.js';
import {
  parseAmount,
  parseEmail,
  parseLanguage,
  parseMethod,
  parseName,
} from '../lib/validation.js';
import {
  createTransaction,
  getTransaction,
  isFinalStatus,
  updateTransaction,
} from '../store/transactions.js';

const router = express.Router();

/** Két SimplePay /query hívás között legalább ennyi idő teljen el ugyanarra a rendelésre. */
const QUERY_THROTTLE_MS = 10_000;

// ---------------------------------------------------------------------------
// POST /api/payment/start
// ---------------------------------------------------------------------------

router.post('/start', async (req, res, next) => {
  try {
    // 1) Bemenet ellenőrzése. Az összeghatárokat a szerver dönti el, nem a kliens.
    const amount = parseAmount(req.body?.amount);
    const method = parseMethod(req.body?.method);
    const customerEmail = parseEmail(req.body?.email);
    const donorName = parseName(req.body?.name);
    // A fizetooldal nyelve: kulfoldi kartyabirtokos ne magyar oldalt kapjon.
    const language = parseLanguage(req.body?.language);

    // 2) Egyedi megrendelés-azonosító.
    const orderRef = generateOrderRef('ORS');

    // 3) Rekord létrehozása MÉG a SimplePay hívás előtt: így egy azonnal
    //    beérkező IPN-nek is van mihez kapcsolódnia.
    createTransaction({ orderRef, amount, method, customerEmail, donorName });

    // 4) Payload + végpont a fizetési mód szerint.
    //
    //    A két mód KÉT KÜLÖN API: a kártya a v2 /start, a Qvik az /rtp/start.
    //    Ezért kapott korábban 5014-et a `methods: ["QVIK"]` próbálkozás.
    const isQvik = method === 'qvik';

    const { payload, expiresAt } = isQvik
      ? buildQvikStartPayload({ orderRef, amount, customerEmail, language, customerName: donorName })
      : buildCardStartPayload({ orderRef, amount, customerEmail, language });

    const endpoint = isQvik ? ENDPOINTS.rtpStart : ENDPOINTS.start;

    if (LOG_RAW_SIMPLEPAY_RESPONSE) {
      console.log('[payment] -> start %s | %s Ft | %s | %s', orderRef, amount, method, endpoint);
    }

    const response = await callSimplePay(endpoint, payload);
    const result = extractStartResult(response);

    updateTransaction(orderRef, {
      status: 'PENDING',
      transactionId: result.transactionId,
    });

    if (!result.paymentUrl) {
      throw new SimplePayError('A SimplePay nem adott vissza fizetési linket.');
    }

    // 5) Válasz a kliensnek.
    //
    //    Mindkét ág ugyanazt adja vissza: egy fizetési linket. A Qvik QR-kódot
    //    és a banki app megnyitását a SimplePay a saját oldalán intézi, nyers
    //    QR stringet az API nem ad -- ezért nem rajzolunk sajátot.
    //
    //    A kliens ebből dönt: mobilon átnavigál a linkre, asztali gépen
    //    QR-kódot mutat belőle, hogy telefonról is fizethető legyen.
    return res.json({
      ok: true,
      method,
      orderRef,
      amount,
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/payment/status/:orderRef
//
// A frontend rövid polling-gal hívja. Elsődlegesen a saját tárunkból
// válaszolunk (amit az IPN frissít); ha még nincs végállapot és letelt a
// throttle, rákérdezünk a SimplePay /query végpontján is.
// ---------------------------------------------------------------------------

router.get('/status/:orderRef', async (req, res, next) => {
  try {
    const { orderRef } = req.params;
    const record = getTransaction(orderRef);

    if (!record) {
      return res.status(404).json({ ok: false, error: 'Ismeretlen tranzakció.' });
    }

    let current = record;

    const shouldRefresh =
      !isFinalStatus(current.status) &&
      Date.now() - new Date(current.lastQueryAt ?? 0).getTime() > QUERY_THROTTLE_MS;

    if (shouldRefresh) {
      try {
        const remote = await queryTransactionStatus(orderRef);
        current =
          updateTransaction(orderRef, {
            status: remote.status,
            transactionId: remote.transactionId ?? current.transactionId,
            lastQueryAt: new Date().toISOString(),
          }) ?? current;
      } catch (error) {
        // A lekérdezés hibája nem boríthatja a pollingot: a tárolt állapotot adjuk vissza.
        console.error('[payment] /query hiba (%s): %s', orderRef, error.message);
        current = updateTransaction(orderRef, { lastQueryAt: new Date().toISOString() }) ?? current;
      }
    }

    return res.json({
      ok: true,
      orderRef: current.orderRef,
      status: current.status,
      isFinal: isFinalStatus(current.status),
      amount: current.amount,
      method: current.method,
      transactionId: current.transactionId,
      updatedAt: current.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/payment/back
//
// Ide irányítja vissza a SimplePay a BÖNGÉSZŐT a fizetés után:
//   ?r=<base64 JSON>&s=<alairas az r ertekere>
// A JSON tartalma: { r, t (transactionId), e (esemeny), m (merchant), o (orderRef) }
//
// FONTOS: ez csak felhasználói visszajelzés. A tranzakciót SOHA nem innen,
// hanem az IPN-ből / a /query válaszából tekintjük teljesítettnek.
// ---------------------------------------------------------------------------

router.get('/back', (req, res) => {
  const encoded = String(req.query.r ?? '');
  const signature = String(req.query.s ?? '');

  const redirect = (params) => {
    const url = new URL('/adomany/visszajelzes', PUBLIC_FRONTEND_URL);
    for (const [key, value] of Object.entries(params)) {
      if (value != null) url.searchParams.set(key, String(value));
    }
    return res.redirect(302, url.toString());
  };

  if (!encoded || !signature) {
    return redirect({ status: 'ERROR', reason: 'missing-params' });
  }

  // Az aláírás a base64 stringre (az "r" paraméter értékére) készül.
  if (createSignature(encoded) !== signature) {
    console.warn('[payment] /back: ervenytelen alairas.');
    return redirect({ status: 'ERROR', reason: 'invalid-signature' });
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return redirect({ status: 'ERROR', reason: 'invalid-payload' });
  }

  // data.e: SUCCESS | FAIL | TIMEOUT | CANCEL
  return redirect({
    status: data.e ?? 'ERROR',
    orderRef: data.o,
    transactionId: data.t,
  });
});

// ---------------------------------------------------------------------------
// GET /api/payment/config
// A frontend innen olvassa az összeghatárokat, hogy azok egyetlen helyen
// (a .env-ben) legyenek karbantartva.
// ---------------------------------------------------------------------------

router.get('/config', (_req, res) => {
  res.json({
    ok: true,
    currency: 'HUF',
    minAmount: DONATION_MIN_HUF,
    maxAmount: DONATION_MAX_HUF,
  });
});

export default router;
