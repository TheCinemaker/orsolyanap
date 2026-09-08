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
  Utensils,
  PlusCircle,
  Edit2,
  X,
  MapPin,
  Check,
  Bell
} from 'lucide-react';

export default function ExhibitorDashboard() {
  const {
    activeExhibitor,
    logoutExhibitor,
    menuItems,
    orders,
    updateItemStock,
    setItemStockDirect,
    updateItemStatus,
    saveMenuItem,
    updateExhibitorNotice,
    updateOrderStatus
  } = useOrsolya();

  if (!activeExhibitor) return null;

  // Filter items & orders for this exhibitor
  const exhibitorItems = menuItems.filter((i) => i.exhibitor_id === activeExhibitor.id);
  const exhibitorOrders = orders.filter((o) => o.exhibitor_id === activeExhibitor.id);

  // States
  const [noticeInput, setNoticeInput] = useState(activeExhibitor.notice || '');
  const [isOpenInput, setIsOpenInput] = useState(activeExhibitor.isOpen);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states for new/edited item
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 2500,
    initial_stock: 30,
    category: 'bogracs',
    tags: '🔥 Bográcsos',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  });

  const handleSaveNotice = (e) => {
    e.preventDefault();
    updateExhibitorNotice(activeExhibitor.id, noticeInput, isOpenInput);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const tagArray = formData.tags
      ? formData.tags.split(',').map((t) => t.trim())
      : ['Kézműves'];

    saveMenuItem({
      ...formData,
      price: Number(formData.price),
      initial_stock: Number(formData.initial_stock),
      tags: tagArray,
      id: editingItem ? editingItem.id : undefined
    });

    setIsAddItemOpen(false);
    setEditingItem(null);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      initial_stock: item.initial_stock || 30,
      category: item.category || 'bogracs',
      tags: item.tags ? item.tags.join(', ') : '',
      image: item.image || ''
    });
    setIsAddItemOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
                ÁRUS PORTÁL
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {activeExhibitor.location}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">{activeExhibitor.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Valós idejű adagszámláló és standkezelő felület
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: '',
                  description: '',
                  price: 2500,
                  initial_stock: 30,
                  category: 'bogracs',
                  tags: '🔥 Bográcsos',
                  image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
                });
                setIsAddItemOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Új Étel / Termék</span>
            </button>

            <button
              onClick={logoutExhibitor}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Kijelentkezés</span>
            </button>
          </div>
        </div>

        {/* Notice Broadcast Form */}
        <form
          onSubmit={handleSaveNotice}
          className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Megaphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
            <input
              type="text"
              placeholder="Élő üzenet a vásárlóknak (pl. 🔥 A gulyás elkészült! Forró forralt bor kapható!)"
              value={noticeInput}
              onChange={(e) => setNoticeInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={isOpenInput}
                onChange={(e) => setIsOpenInput(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Stand Nyitva</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl"
            >
              Mentés
            </button>
          </div>
        </form>
      </div>

      {/* Grid: Left column (Real-time Stock Counter), Right column (Incoming Orders) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quick Stock Counter & Offerings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Ételeid & Gyors Adagszámláló</span>
            </h3>
            <span className="text-xs text-slate-400">{exhibitorItems.length} ajánlat</span>
          </div>

          <div className="space-y-4">
            {exhibitorItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
              >
                {/* Item Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="text-base font-bold text-white">{item.name}</h4>
                      <span className="text-xs font-extrabold text-amber-400">
                        {item.price.toLocaleString('hu-HU')} Ft / adag
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    title="Szerkesztés"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => updateItemStatus(item.id, 'ready', 0)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      item.status === 'ready'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Azonnal Kapható</span>
                  </button>

                  <button
                    onClick={() => updateItemStatus(item.id, 'cooking', 15)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      item.status === 'cooking'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Főzés alatt (~15p)</span>
                  </button>

                  <button
                    onClick={() => updateItemStatus(item.id, 'sold_out', 0)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      item.status === 'sold_out' || item.stock === 0
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Elfogyott</span>
                  </button>
                </div>

                {/* Touch-Friendly Giant Stock Counter */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Elérhető Adagszám
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span
                        className={`text-3xl font-black ${
                          item.stock === 0
                            ? 'text-red-500'
                            : item.stock <= 5
                            ? 'text-amber-400 animate-pulse'
                            : 'text-emerald-400'
                        }`}
                      >
                        {item.stock}
                      </span>
                      <span className="text-xs text-slate-400">adag maradt</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => updateItemStock(item.id, -1)}
                      disabled={item.stock <= 0}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <Minus className="w-4 h-4" />
                      <span>-1</span>
                    </button>

                    <button
                      onClick={() => updateItemStock(item.id, 1)}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+1</span>
                    </button>

                    <button
                      onClick={() => updateItemStock(item.id, 10)}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-black text-sm rounded-xl transition-all flex items-center justify-center"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Incoming Orders Feed */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span>Beérkező Előrendelések</span>
            </h3>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {exhibitorOrders.filter((o) => o.status !== 'completed').length} aktív
            </span>
          </div>

          <div className="space-y-4">
            {exhibitorOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">Még nem érkezett előrendelés.</p>
              </div>
            ) : (
              exhibitorOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`bg-slate-900 border rounded-2xl p-4 shadow-xl space-y-3 transition-all ${
                    ord.status === 'pending'
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : ord.status === 'ready'
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        #{ord.id}
                      </span>
                      <h4 className="text-sm font-extrabold text-white">{ord.user_name}</h4>
                      <a
                        href={`tel:${ord.user_phone}`}
                        className="text-xs text-slate-400 hover:text-amber-400"
                      >
                        📞 {ord.user_phone}
                      </a>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-300 block">Átvétel:</span>
                      <span className="text-sm font-black text-amber-400">{ord.pickup_time}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-slate-950 p-2.5 rounded-xl space-y-1 text-xs text-slate-300 border border-slate-800">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-bold text-white">
                          {(it.price * it.quantity).toLocaleString('hu-HU')} Ft
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-slate-800 pt-1 flex justify-between font-extrabold text-white">
                      <span>Összesen:</span>
                      <span className="text-amber-400">{ord.total_price.toLocaleString('hu-HU')} Ft</span>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'accepted')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Elfogadás (Étel készül)</span>
                      </button>
                    )}

                    {ord.status === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'ready')}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1 animate-pulse"
                      >
                        <Flame className="w-4 h-4" />
                        <span>🔥 ÁTVEHETŐ! (Értesítés küldése)</span>
                      </button>
                    )}

                    {ord.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'completed')}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/40 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Kész & Átvéve</span>
                      </button>
                    )}

                    {ord.status === 'completed' && (
                      <span className="text-xs text-slate-500 italic w-full text-center">
                        Rendelés teljesítve
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAddItemOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingItem ? 'Étel / Ajánlat Szerkesztése' : 'Új Étel / Termék Felvétele'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Megnevezés
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Bográcsos Babgulyás"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Leírás / Összetevők
                </label>
                <textarea
                  rows={2}
                  placeholder="Pl. Szabad tűzön főzött csülkös babgulyás friss kenyérrel."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Ár (Ft)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Kezdő Adagszám
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.initial_stock}
                    onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Címkék (vesszővel elválasztva)
                </label>
                <input
                  type="text"
                  placeholder="Pl. Bográcsos, Csípős, Gluténmentes"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg mt-2"
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
