/**
 * GET /api/payment/back
 *
 * Ide irányítja vissza a SimplePay a BÖNGÉSZŐT a fizetés után:
 *   ?r=<base64 JSON>&s=<aláírás az r értékére>
 * A JSON tartalma: { r, t (transactionId), e (esemény), m (merchant), o (orderRef) }
 *
 * FONTOS: ez csak felhasználói visszajelzés. A tranzakciót SOHA nem innen,
 * hanem az IPN-ből / a SimplePay /query válaszából tekintjük teljesítettnek —
 * ezért itt nem is írunk adatbázist.
 */
import { SITE_URL } from '../lib/config.js';
import { createSignature } from '../lib/simplepay.js';

export default async (request) => {
  const url = new URL(request.url);
  const encoded = url.searchParams.get('r') ?? '';
  const signature = url.searchParams.get('s') ?? '';

  const redirect = (params) => {
    const target = new URL('/adomany/visszajelzes', SITE_URL);
    for (const [key, value] of Object.entries(params)) {
      if (value != null) target.searchParams.set(key, String(value));
    }
    return Response.redirect(target.toString(), 302);
  };

  if (!encoded || !signature) {
    return redirect({ status: 'ERROR', reason: 'missing-params' });
  }

  // Az aláírás a base64 stringre (az "r" paraméter értékére) készül.
  if (createSignature(encoded) !== signature) {
    console.warn('[back] Ervenytelen alairas.');
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
};

export const config = {
  path: '/api/payment/back',
};
