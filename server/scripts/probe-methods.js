/**
 * Segédszkript: kideríti, hogy a te SimplePay fiókod mely fizetési mód
 * kódokat fogadja el, és mit ad vissza válaszul.
 *
 * Erre azért van szükség, mert a Qvik metódus kódja és a válasz mezőnevei
 * kereskedői fiókonként/dokumentáció-verziónként eltérhetnek, a nyilvános
 * sandbox fiókon (PUBLICTESTHUF) pedig a Qvik egyáltalán nincs engedélyezve.
 *
 * Futtatás:
 *   cd server
 *   node scripts/probe-methods.js
 *   node scripts/probe-methods.js QVIK WIRE SAJAT_KOD
 *
 * Értelmezés:
 *   OK   -> a mód elfogadott; a kiírt kulcsok közül kell kiválasztani a
 *           QR string és a deep link mezőt (lásd config/simplepay.js).
 *   5014 -> a fiókodon ez a fizetési mód nincs engedélyezve / nem létező kód.
 */
import { ENDPOINTS, MERCHANT, SANDBOX } from '../src/config/simplepay.js';
import { callSimplePay, generateSalt, toSimplePayDate, generateOrderRef } from '../src/lib/simplepay.js';

const DEFAULT_CANDIDATES = ['CARD', 'WIRE', 'QVIK', 'INSTANT', 'QR', 'QVIK_QR', 'IPS'];

const candidates = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_CANDIDATES;

console.log('Uzemmod : %s', SANDBOX ? 'SANDBOX' : 'ELES');
console.log('Merchant: %s', MERCHANT);
console.log('Modok   : %s', candidates.join(', '));
console.log('-'.repeat(70));

for (const method of candidates) {
  const payload = {
    salt: generateSalt(),
    merchant: MERCHANT,
    orderRef: generateOrderRef('PROBE'),
    currency: 'HUF',
    customerEmail: 'probe@example.com',
    language: 'HU',
    sdkVersion: 'OrsolyaApp_MethodProbe_1.0.0',
    methods: [method],
    total: '1000',
    timeout: toSimplePayDate(new Date(Date.now() + 30 * 60 * 1000)),
    url: 'http://localhost:4000/api/payment/back',
    maySelectInvoice: true,
  };

  try {
    const response = await callSimplePay(ENDPOINTS.start, payload);
    console.log('OK   %s -> valasz kulcsok: %s', method.padEnd(10), Object.keys(response).join(', '));
  } catch (error) {
    const codes = error.errorCodes?.length ? error.errorCodes.join(', ') : error.message;
    console.log('HIBA %s -> %s', method.padEnd(10), codes);
  }
}

console.log('-'.repeat(70));
console.log('A reszletes nyers valaszokhoz: LOG_RAW_SIMPLEPAY_RESPONSE=true');
