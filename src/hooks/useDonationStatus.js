import { useEffect, useRef, useState } from 'react';
import { fetchDonationStatus } from '../lib/donationApi';

/**
 * Rövid polling (short polling) egy adomány-tranzakció állapotára.
 *
 * Miért polling és nem WebSocket?
 * A Qvik fizetés a felhasználó banki appjában zajlik, a mi oldalunk közben
 * csak vár. A sikerről a SimplePay az IPN webhookon értesíti a BACKENDET --
 * a böngésző erről közvetlenül nem szerez tudomást. Valamilyen csatorna tehát
 * kell a backend -> böngésző irányba, és ebből a polling a legegyszerűbb,
 * amihez nem kell állandó kapcsolatot tartani. Egy fizetés jellemzően 1-2
 * percig tart, így néhány tucat kérésről van szó.
 *
 * A megvalósítás részletei, amik éles üzemben számítanak:
 *   - `setTimeout` láncot használunk, nem `setInterval`-t: így egy lassú
 *     válasz nem torlódik fel újabb kérésekkel.
 *   - A lekérdezési időköz fokozatosan nő (3s -> 10s), hogy a hosszabb
 *     várakozás ne terhelje feleslegesen a szervert.
 *   - Rejtett böngészőfül esetén szünetel (`visibilitychange`), és a fül
 *     visszahozásakor azonnal frissít.
 *   - Van kemény határidő, ami után magától leáll.
 *
 * @param {string|null} orderRef a figyelt tranzakció azonosítója (null = kikapcsolva)
 * @param {object} [options]
 * @param {number} [options.initialIntervalMs=3000]
 * @param {number} [options.maxIntervalMs=10000]
 * @param {number} [options.timeoutMs=600000] 10 perc után feladjuk
 * @param {(status: string) => void} [options.onFinal] végállapot callback
 * @returns {{ status: string|null, isFinal: boolean, isPolling: boolean, error: string|null }}
 */
export function useDonationStatus(orderRef, options = {}) {
  const {
    initialIntervalMs = 3000,
    maxIntervalMs = 10_000,
    timeoutMs = 10 * 60 * 1000,
    onFinal,
  } = options;

  const [status, setStatus] = useState(null);
  const [isFinal, setIsFinal] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  // A callback ref-ben tartása megakadályozza, hogy egy új függvény-példány
  // minden rendernél újraindítsa a pollingot.
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    if (!orderRef) {
      setStatus(null);
      setIsFinal(false);
      setIsPolling(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    let timerId = null;
    let interval = initialIntervalMs;
    const startedAt = Date.now();
    const controller = new AbortController();

    setIsPolling(true);
    setIsFinal(false);
    setError(null);

    const stop = () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      controller.abort();
      setIsPolling(false);
    };

    const schedule = () => {
      if (cancelled) return;

      if (Date.now() - startedAt > timeoutMs) {
        setError('Lejárt a várakozási idő. Ha fizettél, hamarosan e-mailben igazoljuk.');
        stop();
        return;
      }

      timerId = setTimeout(tick, interval);
      // Fokozatos lassítás: 3s, 4.5s, 6.75s ... maxIntervalMs-ig.
      interval = Math.min(Math.round(interval * 1.5), maxIntervalMs);
    };

    const tick = async () => {
      if (cancelled) return;

      // Rejtett fülön nem kérdezünk, csak újraütemezünk.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        schedule();
        return;
      }

      try {
        const data = await fetchDonationStatus(orderRef, controller.signal);
        if (cancelled) return;

        setStatus(data.status);

        if (data.isFinal) {
          setIsFinal(true);
          stop();
          onFinalRef.current?.(data.status);
          return;
        }
      } catch (requestError) {
        if (cancelled || requestError.name === 'AbortError') return;
        // Az átmeneti hálózati hiba nem állítja le a pollingot -- csak jelezzük.
        setError(requestError.message);
      }

      schedule();
    };

    // Azonnali első lekérdezés, utána ütemezetten.
    tick();

    // A fül visszahozásakor ne várjuk ki a következő ütemezett kört.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        if (timerId) clearTimeout(timerId);
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stop();
    };
  }, [orderRef, initialIntervalMs, maxIntervalMs, timeoutMs]);

  return { status, isFinal, isPolling, error };
}

export default useDonationStatus;
