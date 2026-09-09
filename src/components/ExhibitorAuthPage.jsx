import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import VisitKoszegLogo from './VisitKoszegLogo';
import { Key, ArrowRight, ArrowLeft, ShieldCheck, Copy, Check, Plus, X, Lock, Store, Utensils, Calendar } from 'lucide-react';

export default function ExhibitorAuthPage() {
  const {
    loginExhibitor,
    setActiveView,
    exhibitors,
    updateExhibitorPin,
    addExhibitorTeam,
    showToast
  } = useOrsolya();

  const [pinInput, setPinInput] = useState('');
  const [isOrganizerDirectoryOpen, setIsOrganizerDirectoryOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [copiedPinId, setCopiedPinId] = useState(null);
  const [editingPinExhibitorId, setEditingPinExhibitorId] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');

  // Register Form State
  const [regForm, setRegForm] = useState({
    name: '',
    location: 'Diáksétány 1.',
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    category: 'meleg_etel',
    hasDrinks: false,
    offerings: '',
    days: 'both',
    phone: '',
    email: '',
    story: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginExhibitor(pinInput)) {
      setPinInput('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name.trim()) {
      showToast('Kérjük add meg a csapat / árus nevét!', 'error');
      return;
    }
    if (!regForm.offerings.trim()) {
      showToast('Kérjük add meg a kötelező kínálatot / amit főztök!', 'error');
      return;
    }

    const created = await addExhibitorTeam(regForm);
    if (created) {
      setIsRegisterModalOpen(false);
      // Auto login as new team
      loginExhibitor(created.pin);
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
              Írd be a szervezőktől kapott 4 jegyű PIN kódodat a belépéshez, vagy regisztrálj új csapatot!
            </p>
          </div>
        </div>

        {/* Notice banner if empty database */}
        {exhibitors.length === 0 && (
          <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 text-center space-y-2">
            <p className="text-xs font-bold text-amber-950">
              Még nincs regisztrált csapat az adatbázisban.
            </p>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Új Csapat / Árus Regisztrációja</span>
            </button>
          </div>
        )}

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

        {/* Action Button: Register New Team */}
        <div className="pt-2">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-2xl border border-stone-300 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-800" />
            <span>➕ Új Csapat / Árus Regisztrálása</span>
          </button>
        </div>

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

      {/* ------------------------------------------------------------------ */}
      {/* REGISTER NEW TEAM MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="p-3 bg-amber-100 text-amber-900 rounded-2xl border border-amber-300">
                <Store className="w-6 h-6 text-amber-800" />
              </span>
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  Új Csapat / Árus Regisztrációja
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Regisztrálj új csapatot az Orsolya-napi vásárra! Az adatok azonnal mentődnek a Supabase-be.
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Csapat / Árus Neve *
                </label>
                <input
                  type="text"
                  required
                  placeholder="pl. Kőszegi Polgári Kaszinó"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Stand Helyszíne / Száma *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pl. Diáksétány 1."
                    value={regForm.location}
                    onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Belépési PIN Kód *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="1234"
                    value={regForm.pin}
                    onChange={(e) => setRegForm({ ...regForm, pin: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono text-xs font-black text-center focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Kötelező Kínálat / Mit Főznek? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="pl. Bográcsos Marhapörkölt, Házi Rétes"
                  value={regForm.offerings}
                  onChange={(e) => setRegForm({ ...regForm, offerings: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Fő Kategória
                  </label>
                  <select
                    value={regForm.category}
                    onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="meleg_etel">Meleg étel</option>
                    <option value="hideg_etel">Hideg étel</option>
                    <option value="sutemeny">Sütemény</option>
                    <option value="street_food">Street Food</option>
                    <option value="italok">Italok</option>
                    <option value="egyeb">Egyéb</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Jelenlét Napja
                  </label>
                  <select
                    value={regForm.days}
                    onChange={(e) => setRegForm({ ...regForm, days: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="both">Mindkét nap</option>
                    <option value="saturday">Szombat</option>
                    <option value="sunday">Vasárnap</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasDrinksCheck"
                  checked={regForm.hasDrinks}
                  onChange={(e) => setRegForm({ ...regForm, hasDrinks: e.target.checked })}
                  className="w-4 h-4 text-amber-800 rounded border-stone-300 focus:ring-amber-700"
                />
                <label htmlFor="hasDrinksCheck" className="text-xs font-extrabold text-stone-800 cursor-pointer">
                  A stand kínál frissítő italokat is!
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Telefonszám (Opcionális)
                  </label>
                  <input
                    type="text"
                    placeholder="+36 30 123 4567"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    E-mail Cím (Opcionális)
                  </label>
                  <input
                    type="email"
                    placeholder="csapat@koszeg.hu"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs rounded-xl"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Csapat Regisztrációja & Belépés</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ORGANIZER PIN DIRECTORY MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isOrganizerDirectoryOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setIsOrganizerDirectoryOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-3">
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

              <button
                onClick={() => {
                  setIsOrganizerDirectoryOpen(false);
                  setIsRegisterModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-extrabold rounded-xl flex items-center gap-1 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Új Csapat</span>
              </button>
            </div>

            {exhibitors.length === 0 ? (
              <div className="p-6 text-center text-stone-500 bg-stone-50 rounded-2xl">
                Nincs még regisztrált csapat. Nyomj az Új Csapat gombra a hozzáadáshoz!
              </div>
            ) : (
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
            )}

            <div className="pt-3 border-t border-stone-200 flex justify-end">
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
