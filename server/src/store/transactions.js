/**
 * Tranzakció-tár.
 *
 * Szándékosan minimális, memóriában tartott implementáció, hogy a modul
 * futtatható legyen adatbázis nélkül is. ÉLES ÜZEMBEN cseréld le tartós
 * tárolóra -- ehhez elég ezt az öt exportált függvényt újraírni, a hívók
 * (routes/*) nem változnak.
 *
 * A projekt már használ Supabase-t, így a kézenfekvő csere egy `donations`
 * tábla (a SQL a SIMPLEPAY_INTEGRACIO.md végén található).
 */

/** @typedef {'INIT'|'PENDING'|'SUCCESS'|'FAIL'|'CANCEL'|'TIMEOUT'} DonationStatus */

/**
 * @typedef {object} DonationTransaction
 * @property {string} orderRef        saját megrendelés-azonosító
 * @property {number} amount          összeg HUF-ban (egész)
 * @property {'card'|'qvik'} method   választott fizetési mód
 * @property {DonationStatus} status
 * @property {string|null} transactionId  SimplePay tranzakció-azonosító
 * @property {string|null} customerEmail
 * @property {string|null} donorName
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {object|null} lastIpn    az utolsó feldolgozott IPN payload
 */

/** @type {Map<string, DonationTransaction>} */
const transactions = new Map();

/** Memóriaszivárgás ellen: ennyi idő után dobjuk a rekordot. */
const TTL_MS = 24 * 60 * 60 * 1000; // 24 óra

/**
 * Új tranzakció rögzítése a SimplePay hívás ELŐTT, hogy egy azonnal beérkező
 * IPN-nek is legyen mihez kapcsolódnia.
 *
 * @param {Pick<DonationTransaction,'orderRef'|'amount'|'method'|'customerEmail'|'donorName'>} data
 * @returns {DonationTransaction}
 */
export function createTransaction(data) {
  const now = new Date().toISOString();
  /** @type {DonationTransaction} */
  const record = {
    orderRef: data.orderRef,
    amount: data.amount,
    method: data.method,
    status: 'INIT',
    transactionId: null,
    customerEmail: data.customerEmail ?? null,
    donorName: data.donorName ?? null,
    createdAt: now,
    updatedAt: now,
    lastIpn: null,
  };
  transactions.set(record.orderRef, record);
  return record;
}

/**
 * @param {string} orderRef
 * @returns {DonationTransaction | null}
 */
export function getTransaction(orderRef) {
  return transactions.get(orderRef) ?? null;
}

/**
 * Részleges frissítés.
 *
 * @param {string} orderRef
 * @param {Partial<DonationTransaction>} patch
 * @returns {DonationTransaction | null}
 */
export function updateTransaction(orderRef, patch) {
  const existing = transactions.get(orderRef);
  if (!existing) return null;

  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  transactions.set(orderRef, updated);
  return updated;
}

/**
 * Végállapotok, amelyekből már nem lépünk tovább. Az IPN-ek sorrendje nem
 * garantált és ismétlődhetnek is, ezért egy SUCCESS-t nem írhat felül egy
 * később érkező TIMEOUT.
 *
 * @param {DonationStatus} status
 */
export function isFinalStatus(status) {
  return status === 'SUCCESS' || status === 'FAIL' || status === 'CANCEL' || status === 'TIMEOUT';
}

/** Lejárt rekordok takarítása. */
export function pruneExpired(now = Date.now()) {
  for (const [orderRef, record] of transactions) {
    if (now - new Date(record.createdAt).getTime() > TTL_MS) {
      transactions.delete(orderRef);
    }
  }
}

// Óránként takarítunk. Az unref() miatt ez a timer nem tartja életben a processzt.
setInterval(() => pruneExpired(), 60 * 60 * 1000).unref();
