import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import VisitKoszegLogo from './VisitKoszegLogo';
import { Key, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ExhibitorAuthPage() {
  const { loginExhibitor, setActiveView } = useOrsolya();
  const [pinInput, setPinInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginExhibitor(pinInput)) {
      setPinInput('');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-3xl p-8 shadow-sm relative overflow-hidden">
        {/* Top Header */}
        <div className="text-center space-y-3 mb-8">
          <VisitKoszegLogo />
          <div className="pt-2">
            <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60">
              ORSOLYA-NAPI ÁRUS PORTÁL
            </span>
            <h1 className="text-2xl font-bold text-stone-900 mt-3">
              Árus & Stand Belépés
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Lépj be a standod PIN kódjával az adagszámok, a bemutatkozás és az ételek kezeléséhez.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Stand PIN Kód
            </label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                placeholder="Pl. 1234"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-800 hover:bg-amber-700 text-white font-bold text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Belépés a Stand Felületre</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400 mb-2 font-medium">Demó belépési kódok:</p>
          <div className="flex flex-wrap justify-center gap-2 text-[11px] font-mono font-semibold">
            <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200">
              1234 (Jurisics Vár)
            </span>
            <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200">
              2345 (Borosgazdák)
            </span>
            <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200">
              3456 (Rétesház)
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveView('visitor')}
          className="mt-6 w-full text-center text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vissza a látogatói felületre</span>
        </button>
      </div>
    </div>
  );
}
