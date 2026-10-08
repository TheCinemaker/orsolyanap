/**
 * Bemenet-ellenőrzés. Minden kliensről érkező adatot itt szűrünk meg --
 * az összeg és a fizetési mód SOHA nem kerülhet ellenőrzés nélkül a
 * SimplePay payloadba.
 */
import {
  DONATION_MIN_HUF,
  DONATION_MAX_HUF,
  PAYMENT_METHODS,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  DONATION_FALLBACK_EMAIL,
} from './config.js';

export class ValidationError extends Error {
  /**
   * @param {string} message felhasználónak is megmutatható, magyar nyelvű üzenet
   * @param {string} [field]
   */
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field ?? null;
  }
}

/**
 * Összeg normalizálása egész HUF-ra.
 *
 * Elfogad számot és stringet is (a beírt "5 000" / "5.000" alakokat is),
 * de csak a megengedett sávban lévő, pozitív egészt engedi tovább.
 *
 * @param {unknown} input
 * @returns {number}
 */
export function parseAmount(input) {
  const normalized =
    typeof input === 'string' ? input.replace(/[\s\u00A0.,]/g, '') : input;

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new ValidationError('Az összeg nem értelmezhető.', 'amount');
  }
  if (!Number.isInteger(amount)) {
    throw new ValidationError('Az összeg csak egész forint lehet.', 'amount');
  }
  if (amount < DONATION_MIN_HUF) {
    throw new ValidationError(
      `A legkisebb támogatható összeg ${DONATION_MIN_HUF.toLocaleString('hu-HU')} Ft.`,
      'amount'
    );
  }
  if (amount > DONATION_MAX_HUF) {
    throw new ValidationError(
      `A legnagyobb online támogatható összeg ${DONATION_MAX_HUF.toLocaleString('hu-HU')} Ft.`,
      'amount'
    );
  }

  return amount;
}

/**
 * @param {unknown} input
 * @returns {'card'|'qvik'}
 */
export function parseMethod(input) {
  const method = String(input ?? '').toLowerCase();
  if (!PAYMENT_METHODS.includes(method)) {
    throw new ValidationError('Ismeretlen fizetési mód.', 'method');
  }
  return /** @type {'card'|'qvik'} */ (method);
}

/**
 * A SimplePay kötelező mezője, a támogatónak viszont OPCIONÁLIS.
 *
 * Üres bemenetnél az egyesület saját címét küldjük -- így a pultnál senkinek
 * nem kell e-mailt gépelnie. Ha valaki megad címet (mert visszaigazolást kér),
 * azt ellenőrizzük és azt használjuk.
 *
 * Szándékosan megengedő minta: a cél a nyilvánvalóan hibás gépelés kiszűrése,
 * nem az RFC 5322 újraimplementálása.
 *
 * @param {unknown} input
 * @returns {string}
 */
export function parseEmail(input) {
  const raw = String(input ?? '').trim();
  if (raw === '') return DONATION_FALLBACK_EMAIL;

  const email = raw.toLowerCase();
  if (email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new ValidationError('Adj meg egy érvényes e-mail címet.', 'email');
  }
  return email;
}

/**
 * Opcionális név: megtisztítva, hossz-korlátozva.
 *
 * @param {unknown} input
 * @returns {string|null}
 */
export function parseName(input) {
  const name = String(input ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return null;
  if (name.length > 100) {
    throw new ValidationError('A név túl hosszú.', 'name');
  }
  return name;
}

/**
 * A SimplePay fizetőoldal nyelve.
 *
 * Rendezvényen külföldi látogató is fizethet kártyával, ezért a kliens
 * megadhatja a nyelvet. Ismeretlen vagy hiányzó érték esetén nem hibázunk,
 * csak visszaesünk az alapértelmezettre -- a nyelv nem indokolja a fizetés
 * megtagadását.
 *
 * @param {unknown} input
 * @returns {string}
 */
export function parseLanguage(input) {
  const code = String(input ?? '').trim().toUpperCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
}
