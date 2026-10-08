/**
 * GET /api/payment/status/:orderRef
 *
 * A frontend rövid polling-gal hívja, amíg a Qvik fizetés be nem fejeződik.
 *
 * Elsődlegesen a saját adatbázisunkból válaszolunk (ezt az IPN frissíti). Ha
 * még nincs végállapot és letelt a throttle, rákérdezünk a SimplePay /query
 * végpontján is -- így egy elveszett IPN sem okoz beragadt "várakozás" állapotot.
 */
import { ENDPOINTS, MERCHANT, assertConfig } from '../lib/config.js';
import { queryTransactionStatus } from '../lib/simplepay.js';
import { getTransaction, isFinalStatus, updateTransaction } from '../lib/store.js';

/** Két SimplePay /query hívás között legalább ennyi idő teljen el. */
const QUERY_THROTTLE_MS = 10_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // A polling válasza soha nem cache-elhető.
      'Cache-Control': 'no-store',
    },
  });

export default async (request, context) => {
  try {
    assertConfig();

    const orderRef = context.params?.orderRef;
    if (!orderRef) return json({ ok: false, error: 'Hiányzó azonosító.' }, 400);

    let record = await getTransaction(orderRef);
    if (!record) return json({ ok: false, error: 'Ismeretlen tranzakció.' }, 404);

    const stale = Date.now() - new Date(record.lastQueryAt ?? 0).getTime() > QUERY_THROTTLE_MS;

    if (!isFinalStatus(record.status) && stale) {
      try {
        const remote = await queryTransactionStatus(orderRef, ENDPOINTS.query, MERCHANT);
        record =
          (await updateTransaction(orderRef, {
            status: remote.status,
            transactionId: remote.transactionId ?? record.transactionId,
            lastQueryAt: new Date().toISOString(),
          })) ?? record;
      } catch (error) {
        // A lekérdezés hibája nem boríthatja a pollingot.
        console.error('[status] /query hiba (%s): %s', orderRef, error.message);
        record = (await updateTransaction(orderRef, { lastQueryAt: new Date().toISOString() })) ?? record;
      }
    }

    return json({
      ok: true,
      orderRef: record.orderRef,
      status: record.status,
      isFinal: isFinalStatus(record.status),
      amount: record.amount,
      method: record.method,
      transactionId: record.transactionId,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error('[status] Varatlan hiba: %s', error.stack || error.message);
    return json({ ok: false, error: 'Váratlan hiba történt.' }, 500);
  }
};

export const config = {
  path: '/api/payment/status/:orderRef',
};
