import { useEffect } from 'react';

/**
 * Megakadályozza, hogy a háttéroldal görgethető legyen, amíg nyitva van egy
 * modál vagy fiók.
 *
 * MIÉRT SZÁMLÁLÓVAL: előfordul, hogy egyszerre két réteg van nyitva -- a
 * stand részletei, és onnan a "Hol találom?" térkép. Ha mindegyik a maga
 * bezárásakor egyszerűen visszaállítaná a görgetést, a belső ablak
 * bezárásakor a még nyitva lévő külső mögött máris görgethetővé válna a lap.
 * Ezért modul szintű számlálót vezetünk: a zár akkor oldódik, amikor az
 * UTOLSÓ réteg is becsukódott.
 *
 * Az eredeti `overflow` értéket elmentjük és visszaadjuk, hogy ne írjunk
 * felül egy esetleges meglévő stílust.
 *
 * @param {boolean} isLocked true, amíg a réteg nyitva van
 */
export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;

    const body = document.body;

    if (lockCount === 0) {
      previousOverflow = body.style.overflow;
      body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        body.style.overflow = previousOverflow;
      }
    };
  }, [isLocked]);
}

/** Hány réteg tartja épp zárva a görgetést. */
let lockCount = 0;

/** A body eredeti overflow értéke, az első zárolás előtt. */
let previousOverflow = '';

export default useScrollLock;
