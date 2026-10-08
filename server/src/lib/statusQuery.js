/**
 * Tranzakció-állapot lekérdezése közvetlenül a SimplePay-től (/query).
 *
 * Az IPN az elsődleges, push alapú csatorna; ez a lekérdezés a tartalék:
 * ha az IPN elveszne vagy késne, a frontend pollingja így is korrekt
 * végállapotot kap.
 */
import { ENDPOINTS, MERCHANT } from '../config/simplepay.js';
import { callSimplePay, generateSalt } from './simplepay.js';

/**
 * A SimplePay részletes státuszainak leképezése a saját, egyszerűsített
 * állapotgépünkre.
 *
 * @param {string} simplePayStatus
 * @returns {'PENDING'|'SUCCESS'|'FAIL'|'CANCEL'|'TIMEOUT'}
 */
export function mapSimplePayStatus(simplePayStatus) {
  switch (String(simplePayStatus || '').toUpperCase()) {
    case 'FINISHED':
    case 'AUTHORIZED':
      return 'SUCCESS';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCEL';
    case 'TIMEOUT':
      return 'TIMEOUT';
    case 'NOTAUTHORIZED':
    case 'FRAUD':
    case 'INFRAUD':
    case 'REVERSED':
      return 'FAIL';
    default:
      // INIT, INPAYMENT és minden ismeretlen érték: még nincs végállapot.
      return 'PENDING';
  }
}

/**
 * @param {string} orderRef
 * @returns {Promise<{ status: 'PENDING'|'SUCCESS'|'FAIL'|'CANCEL'|'TIMEOUT', transactionId: string|null, raw: object|null }>}
 */
export async function queryTransactionStatus(orderRef) {
  const response = await callSimplePay(ENDPOINTS.query, {
    salt: generateSalt(),
    merchant: MERCHANT,
    orderRefs: [orderRef],
    detailed: true,
  });

  const transaction = Array.isArray(response.transactions)
    ? response.transactions.find((item) => item.orderRef === orderRef) ?? response.transactions[0]
    : null;

  if (!transaction) {
    return { status: 'PENDING', transactionId: null, raw: null };
  }

  return {
    status: mapSimplePayStatus(transaction.status),
    transactionId: transaction.transactionId != null ? String(transaction.transactionId) : null,
    raw: transaction,
  };
}
