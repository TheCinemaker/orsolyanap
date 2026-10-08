import React, { useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

import { useDonationStatus } from '../hooks/useDonationStatus';

/**
 * A kártyás fizetés után ide tér vissza a felhasználó
 * (a backend /api/payment/back irányítja át ide).
 *
 * A böngésző URL-jében érkező állapot csak ELŐZETES visszajelzés -- a backend
 * már ellenőrizte az aláírást, de a tranzakciót az IPN hitelesíti. Ezért a
 * "SUCCESS" esetén is lekérdezzük a valódi állapotot a szerverünktől.
 *
 * @param {object} props
 * @param {() => void} [props.onClose] visszalépés az alkalmazásba
 */
export default function DonationResult({ onClose }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlStatus = params.get('status');
  const orderRef = params.get('orderRef');

  // A szervertől kérjük el a hiteles állapotot. Ha nincs orderRef,
  // a hook kikapcsolva marad.
  const { status, isFinal, isPolling } = useDonationStatus(orderRef);

  const effectiveStatus = isFinal ? status : urlStatus;
  const isSuccess = effectiveStatus === 'SUCCESS';

  useEffect(() => {
    if (!isSuccess) return;
    try {
      confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
    } catch {
      // csak dísz
    }
  }, [isSuccess]);

  const content = (() => {
    if (isSuccess) {
      return {
        Icon: CheckCircle2,
        iconClass: 'text-green-500',
        title: 'Köszönjük a támogatást!',
        body: 'Az adományod megérkezett. A visszaigazolást e-mailben küldjük.',
      };
    }
    if (effectiveStatus === 'CANCEL') {
      return {
        Icon: XCircle,
        iconClass: 'text-zinc-400',
        title: 'A fizetést megszakítottad',
        body: 'Nem történt terhelés. Bármikor újrapróbálhatod.',
      };
    }
    if (effectiveStatus === 'TIMEOUT') {
      return {
        Icon: AlertCircle,
        iconClass: 'text-amber-500',
        title: 'Lejárt a fizetési idő',
        body: 'A tranzakció időkorlátja letelt. Indíts új fizetést.',
      };
    }
    if (effectiveStatus === 'FAIL') {
      return {
        Icon: XCircle,
        iconClass: 'text-red-500',
        title: 'Sikertelen fizetés',
        body: 'A bank elutasította a tranzakciót. Ellenőrizd a kártyaadatokat, vagy próbálj másik kártyát.',
      };
    }
    return {
      Icon: AlertCircle,
      iconClass: 'text-zinc-400',
      title: 'Ismeretlen állapot',
      body: 'Nem tudtuk megállapítani a fizetés eredményét. Ha terhelés történt, hamarosan e-mailben értesítünk.',
    };
  })();

  const { Icon, iconClass, title, body } = content;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-8 w-full max-w-md mx-auto text-center shadow-sm">
      <Icon className={`w-14 h-14 mx-auto mb-4 ${iconClass}`} aria-hidden="true" />

      <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h1>
      <p className="text-xs text-zinc-500 mt-2">{body}</p>

      {orderRef && (
        <p className="text-[10px] text-zinc-400 mt-4">
          Azonosító: <span className="font-mono">{orderRef}</span>
        </p>
      )}

      {isPolling && !isFinal && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 mt-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Állapot ellenőrzése...
        </p>
      )}

      <button
        type="button"
        onClick={onClose ?? (() => window.location.assign('/'))}
        className="mt-6 w-full px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold"
      >
        Vissza az alkalmazásba
      </button>
    </div>
  );
}
