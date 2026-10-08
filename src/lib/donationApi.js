/**
 * Kliensoldali API-réteg az adomány-backendhez.
 *
 * A backend bázis URL-je a Vite env-ből jön. Ha nincs megadva, relatív
 * útvonalat használunk -- így ugyanazon a domainen futó proxy (pl. Netlify
 * redirect a /api/* útvonalra) is működik konfiguráció nélkül.
 */

const API_BASE = (import.meta.env.VITE_PAYMENT_API_URL || '').replace(/\/+$/, '');

const endpoint = (path) => `${API_BASE}${path}`;

/**
 * A backend hibaválaszaiból használható, magyar nyelvű üzenetet képez.
 * @param {Response} response
 * @returns {Promise<Error>}
 */
async function toError(response) {
  let message = `Hiba történt (HTTP ${response.status}).`;
  try {
    const data = await response.json();
    if (data?.error) message = data.error;
  } catch {
    // A body nem JSON -- marad az általános üzenet.
  }
  return new Error(message);
}

/**
 * Adomány-tranzakció indítása.
 *
 * @param {object} params
 * @param {number} params.amount   egész HUF
 * @param {'card'|'qvik'} params.method
 * @param {string} params.email
 * @param {string} [params.name]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{
 *   ok: true,
 *   method: 'card'|'qvik',
 *   orderRef: string,
 *   amount: number,
 *   transactionId: string|null,
 *   paymentUrl?: string,
 *   qvikQrString?: string,
 *   qvikDeepLink?: string,
 *   isFallbackQr?: boolean,
 *   expiresAt: string
 * }>}
 */
export async function startDonation({ amount, method, email, name, signal }) {
  const response = await fetch(endpoint('/api/payment/start'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, method, email, name }),
    signal,
  });

  if (!response.ok) throw await toError(response);
  return response.json();
}

/**
 * Egy tranzakció aktuális állapota.
 *
 * @param {string} orderRef
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ ok: true, orderRef: string, status: string, isFinal: boolean, amount: number, method: string }>}
 */
export async function fetchDonationStatus(orderRef, signal) {
  const response = await fetch(endpoint(`/api/payment/status/${encodeURIComponent(orderRef)}`), {
    signal,
  });

  if (!response.ok) throw await toError(response);
  return response.json();
}

/**
 * Összeghatárok a szerverről, hogy a kliensoldali validáció ne csússzon el
 * a szerveroldalitól.
 *
 * @returns {Promise<{ minAmount: number, maxAmount: number, currency: string }>}
 */
export async function fetchDonationConfig() {
  const response = await fetch(endpoint('/api/payment/config'));
  if (!response.ok) throw await toError(response);
  return response.json();
}
