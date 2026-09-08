import React from 'react';
import { X, BookOpen, Calendar, Sparkles, Heart, Landmark, Compass, Award } from 'lucide-react';
import VisitKoszegLogo from './VisitKoszegLogo';

export default function OrsolyaInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <VisitKoszegLogo />
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              VÁSÁRI TÖRTÉNELEM & TRADÍCIÓ
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
              A Kőszegi Orsolya-Napi Vásár Története
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Évszázados kereskedelmi hagyományoktól a Natúrpark Ízei fesztiválgá.
            </p>
          </div>
        </div>

        {/* Story Content Blocks (Apple Cards) */}
        <div className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {/* Card 1: Miért Orsolya-nap */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
              <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <h3>Miért pont Orsolya-nap? (A történelmi nagyvásár)</h3>
            </div>
            <p>
              Kőszeg szabad királyi városként évszázadokon át tarthatott országos nagyvásárokat. Az Orsolya-napi (október 21-hez legközelebb eső) vásár volt a város hajdani kiemelt nagyvására, közvetlenül a tél beállta előtt.
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 pt-1">
              <strong>Funkciója:</strong> Kulcsfontosságú volt a helyi gazdáknak, szőlészeknek és mesterembereknek: a betakarítás után itt adták el vagy cserélték el terményeiket és szerezték be a téli holmit.
            </p>
          </div>

          {/* Card 2: Mióta mai formájában? */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <h3>Újjáéledés 2002-ben: "Natúrpark Ízei"</h3>
            </div>
            <p>
              Bár maga a történelmi adásvétel évszázadokig élt, a hagyomány egy időre megszakadt. A rendezvényt <strong>2002-ben élesztették újjá</strong> a Jurisics-vár Művelődési Központ és az Írottkő Natúrparkért Egyesület összefogásával.
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 pt-1">
              Így a korábbi klasszikus állat- és kirakodóvásárból egy gazdag kulturális és kulináris fesztivál született.
            </p>
          </div>

          {/* Card 3: Mi a vásár lényege ma? */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <h3>Mi a vásár lényege ma?</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>A Natúrpark értékei:</strong> A standokon a Kőszeg-hegyaljai és az Írottkő Natúrpark településeinek minőségi helyi portékái jelennek meg (borászok, méhészek, virágkötők, fafaragók, fazekasok).
              </li>
              <li>
                <strong>Őszi ízek kavalkádja:</strong> Sült gesztenye, kürtőskalács, mézeskalács és a híres kőszegi Kékfrankos borok kóstolója.
              </li>
              <li>
                <strong>Közösségi főzés:</strong> Hagyományos szabadtéri civil főzőverseny és kóstolás a Diáksétányon és a Várudvarban.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs rounded-xl hover:opacity-90"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
