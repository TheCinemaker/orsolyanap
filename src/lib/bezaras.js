/**
 * Kattintás a homályos háttérre = bezárás.
 *
 * Telefonon az X apró célpont a sarokban, és a vendég ösztönösen a kép mellé
 * koppint. Ettől minden felugró réteg ugyanúgy zár be.
 *
 * A `target === currentTarget` feltétel azért kell, mert maga a kártya is
 * ennek a divnek a gyereke: nélküle a kártyán belüli minden kattintás
 * felszállna ide, és a navigálás ugyanabban a pillanatban zárná is be.
 *
 * Ahol a vendég beír vagy képet választ (fotófeltöltés, standos felület),
 * ott SZÁNDÉKOSAN nincs rajta: egy félrekoppintás eldobná a munkáját.
 */
export const hatterBezaras = (onClose) => (e) => {
  if (e.target === e.currentTarget) onClose();
};
