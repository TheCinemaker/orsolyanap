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
  Check
} from 'lucide-react';

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
    updateExhibitorProfile,
    updateOrderStatus
  } = useOrsolya();

  if (!activeExhibitor) return null;

  const exhibitorItems = menuItems.filter((i) => i.exhibitor_id === activeExhibitor.id);
  const exhibitorOrders = orders.filter((o) => o.exhibitor_id === activeExhibitor.id);

  // Profile Form state
  const [profileData, setProfileData] = useState({
    story: activeExhibitor.story || '',
    cause: activeExhibitor.cause || '',
    notice: activeExhibitor.notice || '',
    location: activeExhibitor.location || ''
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              STAND KEZELŐ PORTÁL
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              {activeExhibitor.location}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {activeExhibitor.name}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Árus bemutatkozás, ételek hozzáadása és adagszámláló.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNewDishModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Új Étel Hozzáadása</span>
          </button>

          <button
            onClick={logoutExhibitor}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold rounded-2xl transition-all"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">Kijelentkezés</span>
          </button>
        </div>
      </div>

      {/* Profile & Story Editor Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Heart className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          <span>Stand Bemutatkozás & Történet ("Kik vagyunk, miért főzünk?")</span>
        </h3>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Kik vagyunk & Történetünk
            </label>
            <textarea
              rows={2}
              placeholder="Pl. Kőszegi hagyományőrző társaság vagyunk. Dédszüleink receptje alapján főzünk..."
              value={profileData.story}
              onChange={(e) => setProfileData({ ...profileData, story: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Adomány Célja (Kinek / Miért gyűjtünk?)
              </label>
              <input
                type="text"
                placeholder="Pl. A kőszegi gyermekmentők javára"
                value={profileData.cause}
                onChange={(e) => setProfileData({ ...profileData, cause: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Élő Üzenet / Megjegyzés a Standnál
              </label>
              <input
                type="text"
                placeholder="Pl. A marhapörkölt frissen rotyog, várható elkészülés 12:45!"
                value={profileData.notice}
                onChange={(e) => setProfileData({ ...profileData, notice: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs rounded-xl shadow-sm hover:opacity-90"
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
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Főzött Ételeid & Adagszámláló ({exhibitorItems.length})</span>
          </h3>

          <button
            onClick={openNewDishModal}
            className="text-xs font-semibold text-amber-600 dark:text-amber-500 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Új étel hozzáadása</span>
          </button>
        </div>

        {exhibitorItems.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-zinc-400">
            <p className="text-xs">Még nem vettél fel ételt a standodhoz.</p>
            <button
              onClick={openNewDishModal}
              className="mt-3 px-4 py-2 bg-amber-600 text-white font-semibold text-xs rounded-xl"
            >
              + Új étel hozzáadása
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exhibitorItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDishModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg"
                        title="Szerkesztés"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMenuItem(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg"
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
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                        item.status === 'ready'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      Kész, kapható
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, 'cooking', 15)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                        item.status === 'cooking'
                          ? 'bg-amber-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      Főzés alatt
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, 'sold_out', 0)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                        item.status === 'sold_out' || item.stock === 0
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      Elfogyott
                    </button>
                  </div>
                </div>

                {/* Touch Counter */}
                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Maradt
                    </span>
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">
                      {item.stock} adag
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateItemStock(item.id, -1)}
                      disabled={item.stock <= 0}
                      className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xs rounded-xl shadow-sm hover:bg-zinc-100"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateItemStock(item.id, 1)}
                      className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xs rounded-xl shadow-sm hover:bg-zinc-100"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateItemStock(item.id, 10)}
                      className="px-3 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-amber-500"
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

      {/* Add / Edit Dish Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsDishModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              {editingDish ? 'Étel Szerkesztése' : 'Új Étel Hozzáadása'}
            </h3>

            <form onSubmit={handleDishSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Étel Megnevezése
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Bográcsos Marhapörkölt"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Leírás & Összetevők
                </label>
                <textarea
                  rows={2}
                  placeholder="Pl. Szabad tűzön főzött marhapörkölt házi tarhonyával..."
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Kezdő Adagszám
                </label>
                <input
                  type="number"
                  required
                  value={dishForm.initial_stock}
                  onChange={(e) => setDishForm({ ...dishForm, initial_stock: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Címkék (vesszővel elválasztva)
                </label>
                <input
                  type="text"
                  placeholder="Pl. Bográcsos, Kőszegi Recept"
                  value={dishForm.tags}
                  onChange={(e) => setDishForm({ ...dishForm, tags: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-2xl shadow-sm mt-2"
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
