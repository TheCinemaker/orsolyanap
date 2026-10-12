/**
 * Készülékazonosító.
 *
 * Ettől működik az „egy készülék egy szavazat" és ettől tudjuk, hány
 * különböző telefonról nyitották meg az appot.
 *
 * Egyszer generálódik, utána a böngésző tárolójában marad. NEM személyes adat:
 * véletlen szám, semmi nem köti a látogatóhoz.
 *
 * Amit nem tud: aki kitörli a böngésző tárolóját, új készüléknek látszik. Ez a
 * kliensoldali azonosítás határa. Ezért a szavazat a szerveren naplóba kerül
 * (`item_votes`), amiből a valódi állás bármikor újraszámolható — a napló az
 * igazság, nem a számláló.
 */
const KEY = 'orsolya_device_id';

/** Privát böngészés vagy letiltott tároló esetén ez tartja meg a lap életére. */
let cached = null;

const generate = () => {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {
    // nem baj, jön a tartalék
  }
  return 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
};

export function deviceId() {
  if (cached) return cached;

  try {
    const stored = localStorage.getItem(KEY);
    if (stored && stored.length >= 8) {
      cached = stored;
      return cached;
    }
    const fresh = generate();
    localStorage.setItem(KEY, fresh);
    cached = fresh;
    return cached;
  } catch {
    // Privát ablak, letiltott sütik, beágyazott böngésző: a tároló olvasása
    // és írása is dobhat. Ilyenkor a lap életére szóló azonosítót adunk --
    // a szavazás működik, csak egy újratöltés új készüléknek számít.
    cached = generate();
    return cached;
  }
}
