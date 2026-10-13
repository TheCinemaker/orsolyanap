import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';

/**
 * „Tedd a főképernyőre" sáv.
 *
 * Androidon ez tényleg egy koppintás: a Chrome felkínálja a telepítést egy
 * `beforeinstallprompt` eseménnyel, amit elkapunk és a saját gombunkhoz
 * kötünk.
 *
 * iPhone-on NEM LEHET egy koppintás. A Safari nem ad semmilyen programozott
 * módot a főképernyőre tevésre — ez az Apple korlátja, nem a miénk. Ott
 * marad az, hogy megmutatjuk, hol van a két gomb, amit meg kell nyomni.
 *
 * A sáv nem jelenik meg, ha az app már telepítve fut, és egy elutasítás után
 * sem jön vissza.
 */
const ELREJTVE = 'orsolya_telepites_elrejtve';

/** Már a főképernyőről fut? Akkor nincs mit felajánlani. */
const telepitveFut = () => {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
};

const iphoneSafari = () => {
  const ua = window.navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
  // A Chrome és a Firefox iOS-en is Safari-motort használ, de ott a
  // „Főképernyőhöz adás” nincs a megosztás menüben — csak a Safariban van.
  const safari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && safari;
};

export default function TelepitesSav() {
  const [prompt, setPrompt] = useState(null);
  const [lathato, setLathato] = useState(false);
  const [iosSugo, setIosSugo] = useState(false);

  useEffect(() => {
    if (telepitveFut()) return;
    try {
      if (localStorage.getItem(ELREJTVE) === '1') return;
    } catch {
      // Letiltott tároló: mutathatjuk, csak nem tudjuk megjegyezni.
    }

    if (iphoneSafari()) {
      setLathato(true);
      return;
    }

    const elkap = (e) => {
      // Enélkül a Chrome a saját, könnyen elnézhető sávját mutatná.
      e.preventDefault();
      setPrompt(e);
      setLathato(true);
    };
    window.addEventListener('beforeinstallprompt', elkap);

    const telepult = () => setLathato(false);
    window.addEventListener('appinstalled', telepult);

    return () => {
      window.removeEventListener('beforeinstallprompt', elkap);
      window.removeEventListener('appinstalled', telepult);
    };
  }, []);

  const elrejt = () => {
    setLathato(false);
    setIosSugo(false);
    try {
      localStorage.setItem(ELREJTVE, '1');
    } catch {
      // Nem baj, csak a következő megnyitáskor újra felajánljuk.
    }
  };

  const telepit = async () => {
    if (iphoneSafari()) {
      setIosSugo(true);
      return;
    }
    if (!prompt) return;
    prompt.prompt();
    try {
      await prompt.userChoice;
    } finally {
      // A felkínálás egyszer használható: utána már nincs mit megnyomni.
      setPrompt(null);
      elrejt();
    }
  };

  if (!lathato) return null;

  return (
    <div className="bg-white border border-amber-300/80 rounded-md shadow-xs overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <span className="shrink-0 p-2 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
          <Download className="w-4 h-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-stone-900 leading-tight">
            Tedd ki a főképernyőre
          </p>
          <p className="text-[11px] text-stone-600 font-medium leading-snug">
            Így a vásárban egy koppintással nyílik. Nem tölt le semmit.
          </p>
        </div>

        <button
          onClick={telepit}
          className="shrink-0 px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-extrabold rounded-md cursor-pointer"
        >
          Kirakom
        </button>
        <button
          onClick={elrejt}
          aria-label="Elrejtés"
          className="shrink-0 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* iPhone-on nincs telepítő ablak, csak megmutatjuk a két lépést. */}
      {iosSugo && (
        <div className="border-t border-amber-200 bg-amber-50/70 px-3 py-2.5 space-y-1.5">
          <p className="text-[11px] font-bold text-amber-950">
            iPhone-on két koppintás, a Safari alsó sávjából:
          </p>
          <p className="text-[11px] text-amber-950/90 font-medium flex items-center gap-1.5">
            <Share className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span>
              1. Koppints a <strong>Megosztás</strong> ikonra
            </span>
          </p>
          <p className="text-[11px] text-amber-950/90 font-medium flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span>
              2. Görgess le: <strong>Főképernyőhöz adás</strong>
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
