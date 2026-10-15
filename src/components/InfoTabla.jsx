import React from 'react';
import { Megaphone, Clock, Info, Trash2, Star } from 'lucide-react';
import { useOrsolya } from '../context/OrsolyaContext';

/**
 * INFÓTÁBLA — amit a standok üzennek a vásárnak.
 *
 * Egyirányú folyam: a standok írnak, a látogatók olvassák. Írni csak a
 * bejelentkezett stand tud, a saját PIN-jével; az adatbázis zárja (lásd
 * `supabase-infotabla.sql`), nem a felület jóindulata.
 *
 * MINDEN ÜZENET MELLETT OTT A SZERZŐ ÉS AZ IDŐPONT. Ez nem díszítés: a
 * „Kész a gulyás!" tíz perc múlva még érdekes, két óra múlva félrevezető.
 * Időpont nélkül a vendég nem tudja eldönteni, melyik eset áll.
 *
 * Nem keverjük össze a stand állandó megjegyzésével (`exhibitors.notice`):
 * az azt mondja el, ami egész hétvégén igaz (allergén-infó, hol a sátor).
 */

/** Óra:perc, a magyar olvasat szerint. */
const ora = (iso) =>
  new Date(iso).toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Budapest',
  });

/** „Ma", „Tegnap", vagy a dátum — így a napok nem folynak össze. */
const napCimke = (iso) => {
  const d = new Date(iso);
  const most = new Date();
  const nap = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((nap(most) - nap(d)) / 86400000);
  if (diff === 0) return 'Ma';
  if (diff === 1) return 'Tegnap';
  return d.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' });
};

/** Mennyire friss. A pár perces üzenetet ki is mondjuk, mert az a sürgős. */
const friss = (iso) => {
  const perc = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (perc < 1) return 'most';
  if (perc < 60) return `${perc} perccel ezelőtt`;
  return null;
};

export default function InfoTabla() {
  const { standHirek, exhibitors, isSuperAdmin, deleteStandHir, infotablaOlvasott } =
    useOrsolya();

  /* Az időt percenként újraszámoljuk, különben a „3 perccel ezelőtt" ott
     marad a képernyőn fél órára is. */
  const [, ujraszamol] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => ujraszamol((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  /* Aki megnyitotta a táblát, elolvasta: az alsó sávban lévő pötty eltűnik.
     A legfrissebb üzenet idejét tesszük el, és akkor is frissítjük, ha
     nyitott táblán érkezik új — a vendég azt is látja. */
  const legfrissebb = standHirek.reduce(
    (max, h) => (!max || new Date(h.created_at) > new Date(max) ? h.created_at : max),
    null
  );
  React.useEffect(() => {
    if (legfrissebb) infotablaOlvasott(legfrissebb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legfrissebb]);

  const standNev = new Map(exhibitors.map((x) => [x.id, x]));

  // A legfrissebb elöl. A szerver is így adja, de a realtime úton érkező
  // sorok sorrendjére nem támaszkodunk.
  const lista = [...standHirek].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="space-y-3">
      <div className="bg-white border border-stone-200 rounded-md p-3 sm:p-4">
        <h2 className="text-xs font-black text-stone-950 uppercase tracking-widest flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-800" />
          <span>Infótábla</span>
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-rose-500 opacity-70 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-rose-600" />
          </span>
        </h2>
        <p className="text-[11px] text-stone-600 font-medium mt-1 leading-snug">
          Itt a standok üzennek: mikor lesz kész az étel, mi fogyott el, mi
          kezdődik mindjárt. Minden üzenet mellett ott van, ki és mikor írta.
          Írni csak a standok tudnak.
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-md p-8 text-center">
          <Info className="w-7 h-7 mx-auto mb-2 text-stone-300" />
          <p className="text-sm font-bold text-stone-700">Még nincs üzenet a táblán.</p>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            A vásár alatt ide kerül minden, amit a standok kiírnak. Érdemes
            visszanézni.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {lista.map((h, i) => {
            const stand = standNev.get(h.exhibitor_id);
            const szervezoi = !h.exhibitor_id;
            const elozo = lista[i - 1];
            const ujNap = !elozo || napCimke(elozo.created_at) !== napCimke(h.created_at);
            const frissSzoveg = friss(h.created_at);

            return (
              <React.Fragment key={h.id}>
                {ujNap && (
                  <li className="pt-1 first:pt-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                      {napCimke(h.created_at)}
                    </span>
                  </li>
                )}
                <li
                  className={`bg-white border rounded-md p-3 flex items-start gap-2.5 ${
                    szervezoi ? 'border-amber-300 bg-amber-50/50' : 'border-stone-200'
                  }`}
                >
                  {/* Az admin üzenete nem standtól jön: csillag jelzi, nem
                      logó, különben úgy látszana, mintha egy stand írta. */}
                  {szervezoi ? (
                    <span className="w-9 h-9 rounded-md border border-amber-300 bg-amber-100 shrink-0 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-800 fill-amber-700" />
                    </span>
                  ) : stand?.image ? (
                    <img
                      src={stand.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-9 h-9 rounded-md border border-stone-200 object-contain bg-white shrink-0"
                    />
                  ) : (
                    <span className="w-9 h-9 rounded-md border border-stone-200 bg-stone-50 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[11px] font-black text-stone-900 leading-tight">
                        {szervezoi ? h.szerzo || 'Admin' : stand?.name || 'Stand'}
                      </span>
                      <span className="text-[10px] font-bold text-stone-500 inline-flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {ora(h.created_at)}
                      </span>
                      {frissSzoveg && (
                        <span className="text-[10px] font-extrabold text-rose-700">
                          {frissSzoveg}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-900 font-semibold leading-snug mt-0.5 whitespace-pre-wrap break-words">
                      {h.szoveg}
                      {/* Ha javították, azt kiírjuk: a vendég lássa, hogy a
                          szöveg nem az eredeti, de az időpont az. */}
                      {h.modositva && (
                        <span className="text-[10px] font-bold text-stone-400"> · javítva</span>
                      )}
                    </p>
                  </div>

                  {/* Csak szervezői belépéssel: nyilvános táblán kell legyen
                      mód levenni azt, ami nem odavaló. */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => deleteStandHir(h.id)}
                      title="Levétel a tábláról"
                      aria-label="Üzenet levétele"
                      className="shrink-0 p-1.5 text-stone-400 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
