/**
 * GET /api/payment/config
 *
 * A frontend innen olvassa az összeghatárokat, hogy azok egyetlen helyen
 * (a Netlify környezeti változóiban) legyenek karbantartva.
 */
import { DONATION_MIN_HUF, DONATION_MAX_HUF, CURRENCY } from '../lib/config.js';

export default async () =>
  new Response(
    JSON.stringify({
      ok: true,
      currency: CURRENCY,
      minAmount: DONATION_MIN_HUF,
      maxAmount: DONATION_MAX_HUF,
    }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );

export const config = {
  path: '/api/payment/config',
};
