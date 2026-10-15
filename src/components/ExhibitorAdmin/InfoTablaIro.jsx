import React, { useState } from 'react';
import { Megaphone, Send, Clock, Trash2 } from 'lucide-react';
import { useOrsolya } from '../../context/OrsolyaContext';

/**
 * A stand írólapja az infótáblához.
 *
 * Ez a vásár legfontosabb gombja a „Kész / Elfogyott" hármas után: egy
 * mondattal el lehet mondani az egész vásárnak, hogy mi van most. Az üzenet
 * nem felülírja az előzőt, hanem új sor lesz a táblán, szerzővel és
 * időponttal — így a vendég látja, hogy a „Kész a gulyás!" most szól-e.
 *
 * Írni csak az tud, aki PIN-nel belépett, és csak a saját stand nevében: a
 * beszúrást az adatbázis köti a PIN-hez (`post_stand_hir`).
 */
const OTLETEK = [
  'Kész a gulyás!',
  'Most sültek ki a rétesek!',
  'Fél óra és kész az első adag.',
  'Elfogyott a pörkölt, köszönjük!',
];

export default function InfoTablaIro() {
  const { activeExhibitor, standHirek, postStandHir, deleteStandHir } = useOrsolya();
  const [szoveg, setSzoveg] = useState('');
  const [kuldes, setKuldes] = useState(false);

  const sajat = standHirek
    .filter((h) => h.exhibitor_id === activeExhibitor?.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const kuld = async () => {
    if (szoveg.trim().length < 2 || kuldes) return;
    setKuldes(true);
    const ok = await postStandHir(szoveg);
    setKuldes(false);
    if (ok) setSzoveg('');
  };

  const ora = (iso) =>
    new Date(iso).toLocaleString('hu-HU', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Budapest',
    });

  return (
    <section className="bg-white border border-amber-300 rounded-md overflow-hidden shadow-xs">
      <h3 className="px-3.5 py-2.5 bg-amber-50 border-b border-amber-200 text-sm font-bold text-stone-900 flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-amber-800" />
        <span>Üzenet az Infótáblára</span>
      </h3>

      <div className="p-3.5 space-y-3">
        <p className="text-[11px] text-stone-600 font-medium leading-snug">
          Amit ide írsz, egy-két másodperc múlva ott van minden látogató
          telefonján, a stand nevével és a pontos időponttal. Rövid mondat a
          legjobb.
        </p>

        <div className="flex items-start gap-2">
          <textarea
            rows={2}
            value={szoveg}
            maxLength={280}
            onChange={(e) => setSzoveg(e.target.value)}
            onKeyDown={(e) => {
              // Enter küld, Shift+Enter új sor — ahogy egy chatablakban.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                kuld();
              }
            }}
            placeholder="Pl. Kész a gulyás!"
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
          />
          <button
            type="button"
            onClick={kuld}
            disabled={szoveg.trim().length < 2 || kuldes}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-800 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-extrabold text-xs rounded-md transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Kiírom</span>
          </button>
        </div>

        {/* Kész mondatok: a sátorban egy koppintás legyen, ne fogalmazás. */}
        <div className="flex flex-wrap gap-1.5">
          {OTLETEK.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setSzoveg(o)}
              className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 border border-stone-200 hover:border-amber-300 text-[11px] font-bold text-stone-700 rounded-md transition-all cursor-pointer"
            >
              {o}
            </button>
          ))}
        </div>

        {sajat.length > 0 && (
          <div className="pt-2 border-t border-stone-100 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
              Amit eddig kiírtál ({sajat.length})
            </span>
            {sajat.map((h) => (
              <div
                key={h.id}
                className="flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5"
              >
                <span className="text-[10px] font-bold text-stone-500 inline-flex items-center gap-1 shrink-0 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {ora(h.created_at)}
                </span>
                <p className="text-xs text-stone-900 font-semibold leading-snug flex-1 break-words">
                  {h.szoveg}
                </p>
                <button
                  type="button"
                  onClick={() => deleteStandHir(h.id)}
                  title="Visszavonom"
                  aria-label="Üzenet visszavonása"
                  className="shrink-0 p-1 text-stone-400 hover:text-rose-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
