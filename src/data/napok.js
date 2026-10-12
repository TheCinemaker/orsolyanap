/**
 * A vásár két napja.
 *
 * A standkártyának tudnia kell, hogy MA mit főznek. Ehhez kell egy hely, ami
 * megmondja, a mai dátum a vásár melyik napja — és az a dátum egy helyen van,
 * nem szétszórva a komponensekben.
 */
export const FESTIVAL_DAYS = {
  '2026-10-17': 'saturday',
  '2026-10-18': 'sunday',
};

export const DAY_LABELS = {
  saturday: 'Szombat',
  sunday: 'Vasárnap',
  both: 'Mindkét nap',
};

export const DAY_SHORT = {
  saturday: 'Szo',
  sunday: 'Vas',
};

/**
 * A vásár melyik napja van ma, vagy null, ha a rendezvényen kívül vagyunk.
 *
 * Helyi idő szerint, nem UTC-vel: a `toISOString()` éjfél körül egy nappal
 * elcsúszna, és a látogató szombat este a vasárnapi fogást látná.
 */
export const festivalDayToday = (now = new Date()) => {
  const key =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0');
  return FESTIVAL_DAYS[key] || null;
};
