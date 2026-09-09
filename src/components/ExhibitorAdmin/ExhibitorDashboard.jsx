import React, { useState } from 'react';
import { useOrsolya } from '../../context/OrsolyaContext';
import {
  Flame,
  Clock,
  Plus,
  Minus,
  CheckCircle,
  Megaphone,
  LogOut,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  MapPin,
  Heart,
  Save,
  QrCode
} from 'lucide-react';
import ExhibitorQRCard from '../ExhibitorQRCard';

export default function ExhibitorDashboard() {
  const {
    activeExhibitor,
    logoutExhibitor,
    menuItems,
    orders,
    updateItemStock,
    updateItemStatus,
    saveMenuItem,
    deleteMenuItem,
    updateExhibitorProfile
  } = useOrsolya();

  if (!activeExhibitor) return null;

  const exhibitorItems = menuItems.filter((i) => i.exhibitor_id === activeExhibitor.id);

  // Profile Form state
  const [profileData, setProfileData] = useState({
    story: activeExhibitor.story || '',
    cause: activeExhibitor.cause || '',
    notice: activeExhibitor.notice || '',
    location: activeExhibitor.location || '',
    offerings: activeExhibitor.offerings || '',
    hasDrinks: activeExhibitor.hasDrinks || false
  });

  // Modal states for dishes
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    initial_stock: 30,
    category: 'bogracs',
    tags: 'Bográcsos'
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateExhibitorProfile(activeExhibitor.id, profileData);
  };

  const handleDishSave = (e) => {
    e.preventDefault();
    const tagArray = dishForm.tags
      ? dishForm.tags.split(',').map((t) => t.trim())
      : ['Helyi Recept'];

    saveMenuItem({
      ...dishForm,
      initial_stock: Number(dishForm.initial_stock),
      tags: tagArray,
      id: editingDish ? editingDish.id : undefined
    });

    setIsDishModalOpen(false);
    setEditingDish(null);
  };

  const openEditDishModal = (dish) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description,
      initial_stock: dish.initial_stock || 30,
      category: dish.category || 'bogracs',
      tags: dish.tags ? dish.tags.join(', ') : ''
    });
    setIsDishModalOpen(true);
  };

  const openNewDishModal = () => {
    setEditingDish(null);
    setDishForm({
      name: '',
      description: '',
      initial_stock: 30,
      category: 'bogracs',
      tags: 'Bográcsos'
    });
    setIsDishModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-wider text-emerald-800 uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              STAND KEZELŐ PORTÁL
            </span>
            <span className="text-xs text-stone-500 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              {activeExhibitor.location}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 mt-1">
            {activeExhibitor.name}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Árus bemutatkozás, ételek hozzáadása és adagszámláló.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNewDishModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Új Étel Hozzáadása</span>
          </button>

          <button
            onClick={logoutExhibitor}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold rounded-2xl transition-all border border-stone-200"
          >
            <LogOut className="w-4 h-4 text-rose-700" />
            <span className="hidden sm:inline">Kijelentkezés</span>
          </button>
        </div>
      </div>

      {/* Profile & Story Editor Form */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-700" />
          <span>Stand Bemutatkozás & Történet ("Kik vagyunk, miért főzünk?")</span>
        </h3>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Kik vagyunk & Történetünk
            </label>
            <textarea
              rows={2}
              placeholder="Pl. Kőszegi hagyományőrző társaság vagyunk. Dédszüleink receptje alapján főzünk..."
              value={profileData.story}
              onChange={(e) => setProfileData({ ...profileData, story: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Kínálat összefoglaló (Nem kötelező konkrét ételeket felvinni)
            </label>
            <input
              type="text"
              placeholder="Pl. Sütemények, házi rétesek, pogácsa, forró tea..."
              value={profileData.offerings}
              onChange={(e) => setProfileData({ ...profileData, offerings: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-semibold"
            />
          </div>

          <div className="flex items-center justify-between bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <div>
              <span className="font-extrabold text-stone-900 text-xs block">Ital kapható nálatok a standnál?</span>
              <span className="text-[11px] text-stone-500 font-medium">Ha bekapcsolod, az árus bekerül az "Ital kapható" szűrőbe és a térképre.</span>
            </div>

            <button
              type="button"
              onClick={() => setProfileData({ ...profileData, hasDrinks: !profileData.hasDrinks })}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                profileData.hasDrinks
                  ? 'bg-cyan-800 text-white border-cyan-900 shadow-xs'
                  : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              {profileData.hasDrinks ? 'Ital: BEKAPCSOLVA (ON)' : 'Ital: KIKAPCSOLVA (OFF)'}
            </button>
          </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Adomány Célja (Kinek / Miért gyűjtünk?)
              </label>
              <input
                type="text"
                placeholder="Pl. A kőszegi gyermekmentők javára"
                value={profileData.cause}
                onChange={(e) => setProfileData({ ...profileData, cause: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Élő Üzenet / Megjegyzés a Standnál
              </label>
              <input
                type="text"
                placeholder="Pl. A marhapörkölt frissen rotyog, várható elkészülés 12:45!"
                value={profileData.notice}
                onChange={(e) => setProfileData({ ...profileData, notice: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Bemutatkozás Mentése</span>
            </button>
          </div>
        </form>
      </div>

      {/* Dishes List & Stock Counter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-700" />
            <span>Főzött Ételeid & Adagszámláló ({exhibitorItems.length})</span>
          </h3>

          <button
            onClick={openNewDishModal}
            className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Új étel hozzáadása</span>
          </button>
        </div>

        {exhibitorItems.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500">
            <p className="text-xs font-medium">Még nem vettél fel ételt a standodhoz.</p>
            <button
              onClick={openNewDishModal}
              className="mt-3 px-4 py-2 bg-amber-800 text-white font-bold text-xs rounded-xl"
            >
              + Új étel hozzáadása
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exhibitorItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200/90 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-stone-900">
                        {item.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDishModal(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
                        title="Szerkesztés"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMenuItem(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-700 rounded-lg"
                        title="Törlés"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <button
                      onClick={() => updateItemStatus(item.id, 'ready', 0)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        item.status === 'ready'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Kész, kapható
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, 'cooking', 15)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        item.status === 'cooking'
                          ? 'bg-amber-800 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Főzés alatt
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, 'sold_out', 0)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        item.status === 'sold_out' || item.stock === 0
                          ? 'bg-rose-700 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Elfogyott
                    </button>
                  </div>
                </div>

                {/* Touch Counter */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Maradt
                    </span>
                    <span className="text-2xl font-black text-stone-900">
                      {item.stock} adag
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateItemStock(item.id, -1)}
                      disabled={item.stock <= 0}
                      className="px-3 py-2 bg-white border border-stone-200 text-stone-900 font-bold text-xs rounded-xl shadow-xs hover:bg-stone-100"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateItemStock(item.id, 1)}
                      className="px-3 py-2 bg-white border border-stone-200 text-stone-900 font-bold text-xs rounded-xl shadow-xs hover:bg-stone-100"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateItemStock(item.id, 10)}
                      className="px-3 py-2 bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-amber-700"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stand QR Code & Printable Banner Section */}
      <ExhibitorQRCard exhibitor={activeExhibitor} />

      {/* Add / Edit Dish Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsDishModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-stone-900 mb-4">
              {editingDish ? 'Étel Szerkesztése' : 'Új Étel Hozzáadása'}
            </h3>

            <form onSubmit={handleDishSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Étel Megnevezése
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Bográcsos Marhapörkölt"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Leírás & Összetevők
                </label>
                <textarea
                  rows={2}
                  placeholder="Pl. Szabad tűzön főzött marhapörkölt házi tarhonyával..."
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Kezdő Adagszám
                </label>
                <input
                  type="number"
                  required
                  value={dishForm.initial_stock}
                  onChange={(e) => setDishForm({ ...dishForm, initial_stock: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Címkék (vesszővel elválasztva)
                </label>
                <input
                  type="text"
                  placeholder="Pl. Bográcsos, Kőszegi Recept"
                  value={dishForm.tags}
                  onChange={(e) => setDishForm({ ...dishForm, tags: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-xs mt-2"
              >
                Mentés
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
