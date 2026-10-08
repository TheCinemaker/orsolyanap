/**
 * POST /api/payment/ipn
 *
 * SimplePay IPN (Instant Payment Notification) — a tranzakció EGYETLEN hiteles
 * forrása. A böngésző-visszairányítás manipulálható, az IPN viszont
 * szerver-szerver hívás, aláírással.
 *
 * A SimplePay elvárása:
 *   1. A kérés JSON, a Signature fejlécben HMAC-SHA384 aláírással.
 *   2. A válasz HTTP 200, body = a kapott JSON + `receiveDate` mező, és a saját
 *      válaszunkat is alá kell írni.
 *   3. Érvényes nyugta hiányában a SimplePay újraküld — ezért a feldolgozásnak
 *      idempotensnek KELL lennie.
 */
import { MERCHANT, assertConfig } from '../lib/config.js';
import {
  createSignature,
  verifySignature,
  toSimplePayDate,
  mapSimplePayStatus,
} from '../lib/simplepay.js';
import { finalizeTransaction, getTransaction, isFinalStatus } from '../lib/store.js';

/**
 * Üzleti teendők sikeres adomány után.
 *
 * VÁZ — ide kerül a saját logikád (köszönő e-mail, belső értesítés, igazolás).
 * Az adatbázisba írást a `finalizeTransaction` már elvégezte.
 *
 * Idempotensnek kell lennie: bár a `finalizeTransaction` gondoskodik róla, hogy
 * ez csak egyszer fusson le tranzakciónként, egy külső szolgáltatás hibája
 * újrapróbálkozást okozhat.
 *
 * @param {object} transaction
 * @param {object} ipnPayload
 */
async function handleSuccessfulDonation(transaction, ipnPayload) {
  console.log(
    '[ipn] SIKERES ADOMANY: %s | %s Ft | %s | tx: %s',
    transaction.orderRef,
    transaction.amount,
    transaction.method,
    ipnPayload.transactionId
  );

  // TODO: köszönő e-mail, értesítés az egyesületnek, stb.
}

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // A NYERS body kell: az aláírás pontosan ezekre a byte-okra vonatkozik.
  // Ezért olvasunk szöveget, és csak utána parse-olunk.
  const rawBody = await request.text();
  const signature = request.headers.get('signature');

  if (!verifySignature(rawBody, signature)) {
    console.warn('[ipn] Ervenytelen alairas, elutasitva.');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (payload.merchant && payload.merchant !== MERCHANT) {
    console.warn('[ipn] Ismeretlen merchant: %s', payload.merchant);
    return new Response(JSON.stringify({ error: 'Unknown merchant' }), { status: 400 });
  }

  // A NYUGTÁT minden esetben elkészítjük. Ennek hiánya végtelen újraküldést
  // okozna a SimplePay oldalán -- akkor is, ha a rendelést nem ismerjük.
  const receiptBody = JSON.stringify({ ...payload, receiveDate: toSimplePayDate(new Date()) });
  const receipt = new Response(receiptBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Signature: createSignature(receiptBody),
    },
  });

  // Feldolgozás.
  //
  // Az Express változattal ellentétben itt a válasz ELŐTT dolgozunk, mert egy
  // serverless függvény a Response visszaadása után leállhat -- az "utána
  // elvégezzük" minta itt elveszhetne. A műveletek rövidek (egy-két DB hívás),
  // a SimplePay időkorlátjába beleférnek.
  try {
    assertConfig();

    const orderRef = payload.orderRef;
    const transaction = orderRef ? await getTransaction(orderRef) : null;

    if (!transaction) {
      console.warn('[ipn] Ismeretlen orderRef: %s (nyugta elkuldve)', orderRef);
      return receipt;
    }

    const status = mapSimplePayStatus(payload.status);

    if (!isFinalStatus(status)) {
      // Köztes állapot (pl. INPAYMENT): nyugtázzuk, de nem zárjuk le.
      console.log('[ipn] %s koztes allapot: %s', orderRef, payload.status);
      return receipt;
    }

    // Az adatbázis dönti el, hogy ez az IPN lép-e: már lezárt tranzakciót nem
    // ír felül, és két egyszerre érkező értesítésből is csak egy érvényesül.
    const { applied, record } = await finalizeTransaction(orderRef, {
      status,
      transactionId: payload.transactionId != null ? String(payload.transactionId) : null,
      paidAt: status === 'SUCCESS' ? (payload.paymentDate ?? new Date().toISOString()) : null,
      lastIpn: payload,
    });

    if (!applied) {
      console.log('[ipn] %s mar vegallapotban volt, az IPN-t eldobjuk.', orderRef);
      return receipt;
    }

    if (status === 'SUCCESS') {
      await handleSuccessfulDonation(record ?? transaction, payload);
    } else {
      console.log('[ipn] Nem teljesult: %s | %s', orderRef, status);
    }
  } catch (error) {
    // A nyugtát akkor is visszaadjuk: a SimplePay ne küldjön végtelenül újra.
    // A hiba a naplóban marad, a /status a SimplePay /query-ből pótolja.
    console.error('[ipn] Feldolgozasi hiba: %s', error.stack || error.message);
  }

  return receipt;
};

export const config = {
  path: '/api/payment/ipn',
};
