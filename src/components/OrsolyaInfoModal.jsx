import React from 'react';
import { X, Calendar, Sparkles, Landmark } from 'lucide-react';
import VisitKoszegLogo from './VisitKoszegLogo';

export default function OrsolyaInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200/90 rounded-md p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <VisitKoszegLogo />
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              VÁSÁRI TÖRTÉNELEM & TRADÍCIÓ
            </span>
            <h2 className="text-2xl font-bold text-stone-900 mt-2">
              Orsolya-Napi Vásár – Natúrpark Ízei Gasztronómiai Fesztivál
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Civil Ízek Utcája a Diáksétányon • Évszázados kereskedelmi hagyományoktól a modern gasztrofesztiválig.
            </p>
          </div>
        </div>

        {/* Story Content Blocks */}
        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          {/* Card 1: Miért Orsolya-nap */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
              <Landmark className="w-4 h-4 text-amber-800" />
              <h3>Miért pont Orsolya-nap? (A történelmi nagyvásár)</h3>
            </div>
            <p>
              Kőszeg szabad királyi városként évszázadokon át tarthatott országos nagyvásárokat. Az Orsolya-napi (október 21-hez legközelebb eső) vásár volt a város hajdani kiemelt nagyvására, közvetlenül a tél beállta előtt.
            </p>
            <p className="text-stone-500 pt-1 font-medium">
              <strong>Funkciója:</strong> Kulcsfontosságú volt a helyi gazdáknak, szőlészeknek és mesterembereknek: a betakarítás után itt adták el vagy cserélték el terményeiket és szerezték be a téli holmit.
            </p>
          </div>

          {/* Card 2: Mióta mai formájában? */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
              <Calendar className="w-4 h-4 text-amber-800" />
              <h3>Újjáéledés 2002-ben: "Natúrpark Ízei"</h3>
            </div>
            <p>
              Bár maga a történelmi adásvétel évszázadokig élt, a hagyomány egy időre megszakadt. A rendezvényt <strong>2002-ben élesztették újjá</strong> a Jurisics-vár Művelődési Központ és az Írottkő Natúrparkért Egyesület összefogásával.
            </p>
            <p className="text-stone-500 pt-1 font-medium">
              Így a korábbi klasszikus állat- és kirakodóvásárból egy gazdag kulturális és kulináris fesztivál született.
            </p>
          </div>

          {/* Card 3: Mi a vásár lényege ma? */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
              <Sparkles className="w-4 h-4 text-amber-800" />
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
                <strong>Közösségi főzés:</strong> Hagyományos szabadtéri civil főzőverseny a Diáksétányon.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white font-bold text-xs rounded-md hover:bg-stone-800"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
