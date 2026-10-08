/**
 * SimplePay IPN (Instant Payment Notification) fogadó.
 *
 * Ez a tranzakció EGYETLEN hiteles forrása: a böngésző-visszairányítás
 * manipulálható, az IPN viszont szerver-szerver hívás, aláírással.
 *
 * A SimplePay elvárása:
 *   1. A kérés body-ja JSON, a Signature fejlécben HMAC-SHA384 aláírással.
 *   2. A válasz HTTP 200, a body a KAPOTT JSON kiegészítve a `receiveDate`
 *      mezővel, és a saját válaszunkat is alá kell írni a Signature fejlécben.
 *   3. Ha nem kapunk vissza érvényes nyugtát, a SimplePay újraküldi az
 *      értesítést -- ezért az ide írt logikának idempotensnek kell lennie.
 */
import express from 'express';

import { MERCHANT } from '../config/simplepay.js';
import { createSignature, verifySignature, toSimplePayDate } from '../lib/simplepay.js';
import { mapSimplePayStatus } from '../lib/statusQuery.js';
import { getTransaction, isFinalStatus, updateTransaction } from '../store/transactions.js';

const router = express.Router();

/**
 * Az üzleti oldali teendők egy sikeres adomány után.
 *
 * VÁZ -- ide kerül a saját logikád. Idempotensnek KELL lennie: ugyanaz az
 * orderRef többször is megérkezhet (újraküldés, hálózati ismétlés).
 *
 * Tipikus lépések:
 *   - adomány rögzítése az adatbázisban (Supabase `donations` tábla)
 *   - köszönő e-mail kiküldése a támogatónak
 *   - számla/igazolás generálása
 *   - belső értesítés (pl. Slack, e-mail az egyesületnek)
 *
 * @param {object} transaction a saját tranzakció-rekordunk
 * @param {object} ipnPayload a SimplePay-től kapott nyers IPN adat
 */
async function handleSuccessfulDonation(transaction, ipnPayload) {
  console.log(
    '[ipn] SIKERES ADOMANY: %s | %s Ft | %s | SimplePay tx: %s',
    transaction.orderRef,
    transaction.amount,
    transaction.method,
    ipnPayload.transactionId
  );

  // TODO: saját üzleti logika.
  //
  // Példa Supabase-szel (a projekt már használja):
  //
  //   await supabase.from('donations').upsert({
  //     order_ref: transaction.orderRef,
  //     amount: transaction.amount,
  //     method: transaction.method,
  //     status: 'SUCCESS',
  //     simplepay_transaction_id: String(ipnPayload.transactionId),
  //     donor_email: transaction.customerEmail,
  //     donor_name: transaction.donorName,
  //     paid_at: ipnPayload.paymentDate ?? new Date().toISOString(),
  //   }, { onConflict: 'order_ref' });
  //
  // Az upsert + onConflict adja az idempotenciát.
}

/**
 * Sikertelen / megszakadt tranzakció kezelése.
 *
 * @param {object} transaction
 * @param {object} ipnPayload
 * @param {string} status
 */
async function handleFailedDonation(transaction, ipnPayload, status) {
  console.log(
    '[ipn] Nem teljesult tranzakcio: %s | allapot: %s (SimplePay: %s)',
    transaction.orderRef,
    status,
    ipnPayload.status
  );

  // TODO: ha szükséges, itt jelezd a felhasználónak / naplózd az okot.
}

// ---------------------------------------------------------------------------
// POST /api/payment/ipn
//
// FIGYELEM: ez a route a req.rawBody-t használja (lásd index.js express.json
// verify opcióját), mert az aláírás a NYERS body byte-jaira vonatkozik.
// ---------------------------------------------------------------------------

router.post('/ipn', async (req, res) => {
  const rawBody = req.rawBody ?? '';
  const signature = req.get('Signature');

  // 1) Aláírás ellenőrzése. Enélkül semmit nem hiszünk el.
  if (!verifySignature(rawBody, signature)) {
    console.warn('[ipn] Ervenytelen alairas, a kerest elutasitjuk.');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  /** @type {{ salt?: string, orderRef?: string, merchant?: string, status?: string, transactionId?: string|number, paymentDate?: string, method?: string }} */
  const payload = req.body ?? {};

  // 2) A kereskedői azonosító egyezzen a sajátunkkal.
  if (payload.merchant && payload.merchant !== MERCHANT) {
    console.warn('[ipn] Ismeretlen merchant: %s', payload.merchant);
    return res.status(400).json({ error: 'Unknown merchant' });
  }

  const orderRef = payload.orderRef;
  const transaction = orderRef ? getTransaction(orderRef) : null;

  // 3) NYUGTA elküldése.
  //
  // Ezt akkor is megtesszük, ha a rendelést nem ismerjük (pl. szerver-újraindulás
  // után elveszett a memóriabeli rekord): a nyugta hiánya végtelen újraküldést
  // okozna a SimplePay oldalán.
  const receipt = { ...payload, receiveDate: toSimplePayDate(new Date()) };
  const receiptBody = JSON.stringify(receipt);

  res
    .status(200)
    .set('Signature', createSignature(receiptBody))
    .type('application/json')
    .send(receiptBody);

  // 4) Feldolgozás a válasz elküldése UTÁN: a SimplePay gyors nyugtát vár,
  //    az üzleti logika (e-mail, adatbázis) ne tartsa fel.
  if (!transaction) {
    console.warn('[ipn] Ismeretlen orderRef: %s (nyugta elkuldve)', orderRef);
    return;
  }

  try {
    const status = mapSimplePayStatus(payload.status);

    // Idempotencia: végállapotból nem lépünk tovább. Egy később érkező
    // TIMEOUT nem írhatja felül a már rögzített SUCCESS-t.
    if (isFinalStatus(transaction.status)) {
      console.log('[ipn] %s mar vegallapotban van (%s), az IPN-t eldobjuk.', orderRef, transaction.status);
      return;
    }

    const updated = updateTransaction(orderRef, {
      status,
      transactionId: payload.transactionId != null ? String(payload.transactionId) : transaction.transactionId,
      lastIpn: payload,
    });

    if (status === 'SUCCESS') {
      await handleSuccessfulDonation(updated ?? transaction, payload);
    } else if (isFinalStatus(status)) {
      await handleFailedDonation(updated ?? transaction, payload, status);
    }
  } catch (error) {
    // A nyugtát már elküldtük, így itt csak naplózunk.
    console.error('[ipn] Feldolgozasi hiba (%s): %s', orderRef, error.stack || error.message);
  }
});

export default router;
