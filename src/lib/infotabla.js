/**
 * Mit olvasott már el a vendég az infótáblán.
 *
 * A legutóbb látott üzenet időpontját tesszük el, nem azonosítókat: egy
 * időpont összehasonlítása elég, és nem nő a végtelenbe. Készülékenként
 * marad, a szerverre nem megy — ez csak az alsó sávban lévő pötty.
 *
 * Minden olvasás és írás try/catch-ben van: privát böngészőablakban és
 * letiltott tárolóval a localStorage hozzáférése kivételt is dobhat, nem
 * csak üresen tér vissza. A pötty ettől legfeljebb mindig látszik; az app
 * nem áll meg.
 */
const KULCS = 'orsolya_infotabla_olvasva';

export const olvasottIdo = () => {
  try {
    return localStorage.getItem(KULCS) || null;
  } catch {
    return null;
  }
};

export const olvasottnakJelol = (iso) => {
  try {
    if (iso) localStorage.setItem(KULCS, iso);
  } catch {
    // Nem baj: a pötty legfeljebb ott marad.
  }
};

/**
 * Hány üzenet érkezett azóta, hogy a vendég utoljára megnyitotta a táblát.
 *
 * Az időpontot a hívó adja (a kontextusból), nem mi olvassuk a tárolóból: a
 * localStorage írása nem vált ki újrarajzolást, tehát a pötty ott maradt
 * volna a sávban, amíg valami más nem mozdul a felületen.
 */
export const olvasatlanSzam = (hirek, utolso) => {
  if (!utolso) return hirek.length;
  const ido = new Date(utolso).getTime();
  return hirek.filter((h) => new Date(h.created_at).getTime() > ido).length;
};
