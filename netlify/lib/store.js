/**
 * Tranzakció-tár Supabase-en.
 *
 * Netlify Functions esetén a memóriabeli tárolás nem opció: minden hívás külön
 * (esetleg hidegindított) példányban fut, nem osztoznak állapoton. Az IPN és a
 * státusz-lekérdezés csak közös adatbázison keresztül talál egymásra.
 *
 * A `donations` táblát KIZÁRÓLAG ez a réteg írja, service role kulccsal. A
 * táblán engedélyezett az RLS, és nincs rajta egyetlen policy sem — így az
 * alkalmazás anon kulcsával senki nem fér hozzá. A séma a
 * `supabase-donations.sql` fájlban van.
 */
import { createClient } from '@supabase/supabase-js';

import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.js';

const TABLE = 'donations';

let client = null;

/** Lusta példányosítás: hidegindításkor csak akkor épül fel, ha tényleg kell. */
function db() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Adatbázis-sor -> alkalmazásbeli objektum. */
function fromRow(row) {
  if (!row) return null;
  return {
    orderRef: row.order_ref,
    amount: row.amount,
    method: row.method,
    status: row.status,
    transactionId: row.simplepay_transaction_id,
    customerEmail: row.donor_email,
    donorName: row.donor_name,
    paidAt: row.paid_at,
    lastQueryAt: row.last_query_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Végállapotok, amelyekből már nem lépünk tovább.
 *
 * Az IPN-ek sorrendje nem garantált és ismétlődhetnek is, ezért egy SUCCESS-t
 * nem írhat felül egy később érkező TIMEOUT.
 *
 * @param {string} status
 */
export function isFinalStatus(status) {
  return status === 'SUCCESS' || status === 'FAIL' || status === 'CANCEL' || status === 'TIMEOUT';
}

/**
 * Új tranzakció rögzítése a SimplePay hívás ELŐTT, hogy egy azonnal beérkező
 * IPN-nek is legyen mihez kapcsolódnia.
 *
 * @param {{ orderRef: string, amount: number, method: string, customerEmail: string, donorName?: string|null }} data
 */
export async function createTransaction(data) {
  const { error } = await db()
    .from(TABLE)
    .insert({
      order_ref: data.orderRef,
      amount: data.amount,
      method: data.method,
      status: 'INIT',
      donor_email: data.customerEmail,
      donor_name: data.donorName ?? null,
    });

  if (error) throw new Error(`Adatbázis hiba (insert): ${error.message}`);
}

/**
 * @param {string} orderRef
 * @returns {Promise<object|null>}
 */
export async function getTransaction(orderRef) {
  const { data, error } = await db()
    .from(TABLE)
    .select('*')
    .eq('order_ref', orderRef)
    .maybeSingle();

  if (error) throw new Error(`Adatbázis hiba (select): ${error.message}`);
  return fromRow(data);
}

/**
 * Részleges frissítés.
 *
 * @param {string} orderRef
 * @param {{ status?: string, transactionId?: string|null, paidAt?: string|null, lastQueryAt?: string|null, lastIpn?: object|null }} patch
 * @returns {Promise<object|null>}
 */
export async function updateTransaction(orderRef, patch) {
  const row = { updated_at: new Date().toISOString() };

  if (patch.status !== undefined) row.status = patch.status;
  if (patch.transactionId !== undefined) row.simplepay_transaction_id = patch.transactionId;
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
  if (patch.lastQueryAt !== undefined) row.last_query_at = patch.lastQueryAt;
  if (patch.lastIpn !== undefined) row.last_ipn = patch.lastIpn;

  const { data, error } = await db()
    .from(TABLE)
    .update(row)
    .eq('order_ref', orderRef)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Adatbázis hiba (update): ${error.message}`);
  return fromRow(data);
}

/**
 * Végállapotba léptetés úgy, hogy egy már lezárt tranzakciót ne írjon felül.
 *
 * A feltételt az ADATBÁZIS ellenőrzi (`.in('status', [...])`), nem a
 * függvénykód — két egyszerre érkező IPN esetén csak az egyik módosít.
 *
 * @param {string} orderRef
 * @param {{ status: string, transactionId?: string|null, paidAt?: string|null, lastIpn?: object|null }} patch
 * @returns {Promise<{ applied: boolean, record: object|null }>}
 */
export async function finalizeTransaction(orderRef, patch) {
  const { data, error } = await db()
    .from(TABLE)
    .update({
      status: patch.status,
      simplepay_transaction_id: patch.transactionId ?? null,
      paid_at: patch.paidAt ?? null,
      last_ipn: patch.lastIpn ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('order_ref', orderRef)
    // Csak akkor lép, ha még nincs végállapotban.
    .in('status', ['INIT', 'PENDING'])
    .select()
    .maybeSingle();

  if (error) throw new Error(`Adatbázis hiba (finalize): ${error.message}`);

  // Ha nem módosult sor, a tranzakció már le volt zárva -- ez nem hiba.
  return { applied: Boolean(data), record: fromRow(data) };
}
