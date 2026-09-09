import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import VisitKoszegLogo from './VisitKoszegLogo';
import { Key, ArrowRight, ArrowLeft, ShieldCheck, Copy, Check, Plus, X, Lock, Trash2 } from 'lucide-react';

export default function ExhibitorAuthPage() {
  const { loginExhibitor, setActiveView, exhibitors, updateExhibitorPin, clearAllDatabaseData, showToast } = useOrsolya();
  const [pinInput, setPinInput] = useState('');
  const [isOrganizerDirectoryOpen, setIsOrganizerDirectoryOpen] = useState(false);
  const [copiedPinId, setCopiedPinId] = useState(null);
  const [editingPinExhibitorId, setEditingPinExhibitorId] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginExhibitor(pinInput)) {
      setPinInput('');
    }
  };

  const handleCopyPin = (exhibitor) => {
    navigator.clipboard.writeText(exhibitor.pin);
    setCopiedPinId(exhibitor.id);
    showToast(`PIN kód (${exhibitor.pin}) másolva a vágólapra!`, 'success');
    setTimeout(() => setCopiedPinId(null), 2500);
  };

  const handleSaveNewPin = (exhibitorId) => {
    if (updateExhibitorPin(exhibitorId, newPinValue)) {
      setEditingPinExhibitorId(null);
      setNewPinValue('');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-3xl p-8 shadow-sm relative overflow-hidden space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <VisitKoszegLogo />
          <div className="pt-2">
            <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60">
              ORSOLYA-NAPI ÁRUS PORTÁL
            </span>
            <h1 className="text-2xl font-bold text-stone-900 mt-3">
              Árus & Stand Belépés
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Írd be a szervezőktől kapott 4 jegyű PIN kódodat a belépéshez! Nem szükséges bonyolult regisztráció.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 text-center">
              Stand Belépési PIN Kód
            </label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                placeholder="****"
                required
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-stone-900 text-center font-mono text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-900 hover:bg-amber-950 text-white font-extrabold text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Belépés a Stand Kezelőbe</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Live Registered PIN shortcuts */}
        {exhibitors.length > 0 && (
          <div className="pt-4 border-t border-stone-100 text-center space-y-2">
            <p className="text-xs text-stone-400 font-medium">Gyors belépés (Regisztrált standok):</p>
            <div className="flex flex-wrap justify-center gap-1.5 text-[11px] font-mono font-bold">
              {exhibitors.slice(0, 4).map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setPinInput(ex.pin)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-xl border border-stone-200 transition-colors"
                >
                  {ex.pin} ({ex.name.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Organizer PIN directory button */}
        <div className="pt-2 border-t border-stone-100">
          <button
            onClick={() => setIsOrganizerDirectoryOpen(true)}
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-2xl border border-amber-200 flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-800" />
            <span>Szervezői Csapat & PIN Kód Jegyzék</span>
          </button>
        </div>

        <button
          onClick={() => setActiveView('visitor')}
          className="w-full text-center text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vissza a látogatói felületre</span>
        </button>
      </div>

      {/* Organizer PIN Directory Modal */}
      {isOrganizerDirectoryOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setIsOrganizerDirectoryOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl border border-amber-300">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  Szervezői Csapat & PIN Kód Jegyzék
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Itt látható az összes regisztrált kiállító csapat és a belépési PIN kódjuk.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {exhibitors.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-stone-50 border border-stone-200/90 p-3.5 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                      {ex.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium truncate">
                      {ex.location} • {ex.days === 'saturday' ? 'Szombat' : ex.days === 'sunday' ? 'Vasárnap' : 'Mindkét nap'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editingPinExhibitorId === ex.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          maxLength={6}
                          value={newPinValue}
                          onChange={(e) => setNewPinValue(e.target.value)}
                          placeholder={ex.pin}
                          className="w-20 px-2 py-1 bg-white border border-amber-500 rounded-lg text-xs font-mono font-bold text-stone-900 text-center"
                        />
                        <button
                          onClick={() => handleSaveNewPin(ex.id)}
                          className="px-2.5 py-1 bg-emerald-800 text-white text-xs font-bold rounded-lg"
                        >
                          Mentés
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-100 text-amber-950 font-mono font-black text-sm px-3 py-1 rounded-xl border border-amber-300">
                          {ex.pin}
                        </span>

                        <button
                          onClick={() => handleCopyPin(ex)}
                          className="p-1.5 text-stone-500 hover:text-amber-800 bg-white rounded-xl border border-stone-200 transition-colors"
                          title="PIN Kód másolása"
                        >
                          {copiedPinId === ex.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setEditingPinExhibitorId(ex.id);
                            setNewPinValue(ex.pin);
                          }}
                          className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 text-[11px] font-bold rounded-xl border border-stone-200"
                        >
                          Módosítás
                        </button>

                        <button
                          onClick={() => {
                            loginExhibitor(ex.pin);
                            setIsOrganizerDirectoryOpen(false);
                          }}
                          className="px-2.5 py-1 bg-amber-900 hover:bg-amber-950 text-white text-[11px] font-extrabold rounded-xl"
                        >
                          Belépés
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (window.confirm('BIZTOSAN TÖRÖLNI AKAROD az összes online Supabase adatbázisban lévő teszt árust és ételt? Ez a művelet nem visszavonható!')) {
                    clearAllDatabaseData();
                    setIsOrganizerDirectoryOpen(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                <span>Adatbázis Nullázása (Purgálás)</span>
              </button>

              <button
                onClick={() => setIsOrganizerDirectoryOpen(false)}
                className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
