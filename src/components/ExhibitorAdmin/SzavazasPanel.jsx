import React, { useEffect, useState } from 'react';
import { useOrsolya } from '../../context/OrsolyaContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { BarChart3, AlertTriangle, RefreshCw, Eye } from 'lucide-react';

/**
 * A közönségszavazás valódi állása, a szervezőnek.
 *
 * A NAPLÓBÓL olvas (`vote_standings`), nem a `menu_items.votes` oszlopból. Az
 * oszlopot a standok szerkesztő felülete is írhatja az anon kulccsal, tehát
 * elvileg elállítható; a napló viszont csak a `vote_for_item` függvényen
 * keresztül változik, és a böngészőből nem írható. Eredményt kihirdetni csak
 * ebből a számból szabad.
 *
 * Ha a kettő eltér, azt KIÍRJUK, nem elhallgatjuk: az eltérés vagy hiba, vagy
 * valaki hozzányúlt a számlálóhoz — mindkettőt tudni kell.
 */
export default function SzavazasPanel() {
  const { menuItems, exhibitors, visitStats } = useOrsolya();
  const [naplo, setNaplo] = useState(null);
  const [osszes, setOsszes] = useState(null);
  const [hiba, setHiba] = useState(null);
  const [tolt, setTolt] = useState(false);

  const betolt = async () => {
    if (!isSupabaseConfigured) return;
    setTolt(true);
    setHiba(null);
    try {
      const [allas, totals] = await Promise.all([
        supabase.rpc('vote_standings'),
        supabase.rpc('vote_totals'),
      ]);
      if (allas.error) throw allas.error;
      if (totals.error) throw totals.error;
      setNaplo(new Map((allas.data || []).map((r) => [r.item_id, Number(r.votes)])));
      setOsszes(totals.data || null);
    } catch (err) {
      // A leggyakoribb ok: a supabase-szavazas-eszkoz.sql még nem futott le.
      setHiba(err?.message || 'Nem sikerült beolvasni a szavazati naplót.');
    } finally {
      setTolt(false);
    }
  };

  useEffect(() => {
    betolt();
  }, []);

  /* Élőben: a menu_items minden szavazatnál frissül, és arra az app már fel
     van iratkozva. A napló összesítését viszont külön kell újrakérni, ezért a
     menuItems változására újraolvasunk. Így a panel követi a szavazást
     anélkül, hogy folyamatosan kérdezgetnénk a szervert. */
  const votesOsszegeOszlopbol = menuItems.reduce((n, i) => n + (i.votes || 0), 0);
  useEffect(() => {
    if (naplo === null) return;
    betolt();
  }, [votesOsszegeOszlopbol]);

  const standName = new Map(exhibitors.map((x) => [x.id, x.name]));

  const sorok = menuItems
    .map((i) => ({
      id: i.id,
      name: i.name,
      stand: standName.get(i.exhibitor_id) || '',
      oszlop: i.votes || 0,
      naplo: naplo ? naplo.get(i.id) || 0 : null,
    }))
    .filter((r) => (r.naplo ?? r.oszlop) > 0)
    .sort((a, b) => (b.naplo ?? b.oszlop) - (a.naplo ?? a.oszlop));

  const elcsuszott = naplo ? sorok.filter((r) => r.oszlop !== r.naplo) : [];

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-md p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
            <BarChart3 className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-extrabold text-stone-900">Közönségszavazás — valódi állás</h4>
            <p className="text-[11px] text-stone-500 font-medium">
              A szavazati naplóból. Eredményt csak ebből hirdess.
            </p>
          </div>
        </div>
        <button
          onClick={betolt}
          disabled={tolt}
          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-md text-[11px] font-bold text-stone-700 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={'w-3 h-3 ' + (tolt ? 'animate-spin' : '')} />
          <span>Frissítés</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-stone-200 rounded-md px-2.5 py-2">
          <div className="text-lg font-black text-stone-900 leading-none">
            {osszes ? Number(osszes.votes).toLocaleString('hu-HU') : '–'}
          </div>
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mt-0.5">szavazat</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-md px-2.5 py-2">
          <div className="text-lg font-black text-stone-900 leading-none">
            {osszes ? Number(osszes.devices).toLocaleString('hu-HU') : '–'}
          </div>
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mt-0.5">készülék</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-md px-2.5 py-2">
          <div className="text-lg font-black text-stone-900 leading-none flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-amber-700" />
            {visitStats ? Number(visitStats.opens).toLocaleString('hu-HU') : '–'}
          </div>
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mt-0.5">megnyitás</div>
        </div>
      </div>

      {hiba && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-2.5 text-[11px] text-rose-900 font-medium">
          <strong>Nem olvasható a napló.</strong> {hiba}
          <br />
          Ha most állítottuk be: futtasd le a <code>supabase-szavazas-eszkoz.sql</code>-t.
        </div>
      )}

      {elcsuszott.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-md p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-950">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
            {elcsuszott.length} ételnél a kiírt szám nem egyezik a naplóval
          </div>
          <p className="text-[11px] text-amber-900/90 font-medium">
            A látogatók a kiírt számot látják, de a napló az érvényes. Helyreállítás a
            gépen: <code>node scripts/szavazatok.mjs --ujraszamol</code>
          </p>
        </div>
      )}

      {sorok.length === 0 ? (
        <p className="text-xs text-stone-500 italic">Még nem érkezett szavazat.</p>
      ) : (
        <div className="max-h-72 overflow-y-auto -mx-1 px-1">
          <table className="w-full text-[11px]">
            <tbody>
              {sorok.map((r, n) => (
                <tr key={r.id} className="border-b border-stone-200/70 last:border-0">
                  <td className="py-1 pr-1 text-stone-400 font-bold align-top w-6">{n + 1}.</td>
                  <td className="py-1 pr-2 align-top">
                    <span className="font-bold text-stone-900">{r.name}</span>
                    {r.stand && <span className="block text-stone-500">{r.stand}</span>}
                  </td>
                  <td className="py-1 text-right align-top whitespace-nowrap">
                    <span className="font-black text-stone-900">{r.naplo ?? r.oszlop}</span>
                    {r.naplo !== null && r.oszlop !== r.naplo && (
                      <span className="block text-amber-800 font-bold">kiírva: {r.oszlop}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
