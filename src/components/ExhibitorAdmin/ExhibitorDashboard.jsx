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
  QrCode,
  UserPlus,
  Phone,
  Mail,
  Share2,
  Calendar,
  WheatOff,
  MilkOff,
  Sparkles,
  Leaf
} from 'lucide-react';
import ExhibitorQRCard from '../ExhibitorQRCard';

export default function ExhibitorDashboard() {
  const {
    activeExhibitor,
    logoutExhibitor,
    menuItems,
    updateItemStatus,
    saveMenuItem,
    deleteMenuItem,
    updateExhibitorProfile,
    addExhibitorTeam,
    postReel,
    convertFileToBase64
  } = useOrsolya();

  // Reel post state
  const [reelCaption, setReelCaption] = useState('');
  const [reelImage, setReelImage] = useState('');
  const [isPostingReel, setIsPostingReel] = useState(false);

  const handleReelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setReelImage(base64);
      } catch (err) {
        console.error('File conversion error', err);
      }
    }
  };

  const handleReelSubmit = async (e) => {
    e.preventDefault();
    if (!reelCaption.trim() || !reelImage) return;

    setIsPostingReel(true);
    await postReel(reelCaption, reelImage);
    setReelCaption('');
    setReelImage('');
    setIsPostingReel(false);
  };

  if (!activeExhibitor) return null;

  const exhibitorItems = menuItems.filter((i) => i.exhibitor_id === activeExhibitor.id);

  // Profile Form state
  const [profileData, setProfileData] = useState({
    story: activeExhibitor.story || '',
    cause: activeExhibitor.cause || '',
    notice: activeExhibitor.notice || '',
    location: activeExhibitor.location || '',
    offerings: activeExhibitor.offerings || '',
    hasDrinks: activeExhibitor.hasDrinks || false,
    days: activeExhibitor.days || 'both',
    phone: activeExhibitor.phone || '',
    email: activeExhibitor.email || '',
    facebook_url: activeExhibitor.facebook_url || '',
    instagram_url: activeExhibitor.instagram_url || '',
    name: activeExhibitor.name || '',
    category: activeExhibitor.category || 'gasztro',
    image: activeExhibitor.image || ''
  });

  // Modal states for Super-Admin New Team Creation
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [createdTeamPinModal, setCreatedTeamPinModal] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    offerings: '',
    location: 'Diáksétány',
    days: 'both',
    phone: '',
    email: '',
    facebook_url: '',
    instagram_url: '',
    hasDrinks: false
  });

  // Modal states for dishes
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    category: 'meleg_etel',
    tags: 'Meleg étel',
    available_day: 'both',
    is_gluten_free: false,
    is_lactose_free: false,
    is_sugar_free: false,
    is_vegan: false,
    image: ''
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateExhibitorProfile(activeExhibitor.id, profileData);
  };

  const handleNewTeamSubmit = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.offerings.trim()) return;

    const createdTeam = await addExhibitorTeam(teamForm);
    setCreatedTeamPinModal(createdTeam);
    setIsTeamModalOpen(false);
    setTeamForm({
      name: '',
      offerings: '',
      location: 'Diáksétány',
      days: 'both',
      phone: '',
      email: '',
      facebook_url: '',
      instagram_url: '',
      hasDrinks: false
    });
  };

  const handleDishSave = (e) => {
    e.preventDefault();
    const tagArray = dishForm.tags
      ? dishForm.tags.split(',').map((t) => t.trim())
      : ['Helyi Recept'];

    saveMenuItem({
      ...dishForm,
      tags: tagArray,
      id: editingDish ? editingDish.id : undefined
    });

    setIsDishModalOpen(false);
    setEditingDish(null);
  };

  const openEditDishModal = (dish) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name || '',
      description: dish.description || '',
      category: dish.category || 'meleg_etel',
      tags: dish.tags ? dish.tags.join(', ') : '',
      available_day: dish.available_day || 'both',
      is_gluten_free: !!dish.is_gluten_free,
      is_lactose_free: !!dish.is_lactose_free,
      is_sugar_free: !!dish.is_sugar_free,
      is_vegan: !!dish.is_vegan,
      image: dish.image || ''
    });
    setIsDishModalOpen(true);
  };

  const openNewDishModal = () => {
    setEditingDish(null);
    setDishForm({
      name: '',
      description: '',
      category: 'meleg_etel',
      tags: 'Meleg étel',
      available_day: 'both',
      is_gluten_free: false,
      is_lactose_free: false,
      is_sugar_free: false,
      is_vegan: false,
      image: ''
    });
    setIsDishModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header Bar */}
      <div className="bg-white border border-stone-200/90 rounded-md p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold tracking-wider text-emerald-800 uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              STAND KEZELŐ PORTÁL
            </span>
            <span className="text-xs text-stone-500 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              {activeExhibitor.location}
            </span>
            <span className="text-xs text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              {activeExhibitor.days === 'saturday' ? 'Szombat' : activeExhibitor.days === 'sunday' ? 'Vasárnap' : 'Mindkét nap (Szo-Vas)'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 mt-1">
            {activeExhibitor.name}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Árus bemutatkozás, ételek hozzáadása és adagszámláló.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openNewDishModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-800 hover:bg-amber-700 text-white font-extrabold text-xs rounded-md shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Étel Hozzáadása</span>
          </button>

          <button
            onClick={logoutExhibitor}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold rounded-md transition-all border border-stone-200"
          >
            <LogOut className="w-4 h-4 text-rose-700" />
            <span className="hidden sm:inline">Kijelentkezés</span>
          </button>
        </div>
      </div>

      {/* Profile & Story Editor Form */}
      <div className="bg-white border border-stone-200/90 rounded-md p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-700" />
          <span>Stand Bemutatkozás, Elérhetőségek & Kiállítási Napok</span>
        </h3>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Szervezet / csapat neve *</label>
              <input type="text" required value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-md text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Stand helye *</label>
              <input type="text" required value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-md text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Szervezet kategóriája</label>
              <select value={profileData.category} onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-md text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                <option value="gasztro">Gasztro / Főzőcsapat</option>
                <option value="civil">Civil szervezet</option>
                <option value="egyesület">Egyesület</option>
                <option value="iskola">Iskola / Intézmény</option>
                <option value="közösség">Közösség</option>
                <option value="egyéb">Egyéb</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Szervezet / stand képe <span className="normal-case font-medium text-stone-400">(opcionális)</span></label>
              <div className="flex items-center gap-3">
                {profileData.image && <img src={profileData.image} alt="" className="w-14 h-14 rounded-md object-contain bg-stone-950 border border-stone-200" />}
                <label className="flex-1 cursor-pointer px-3 py-2.5 bg-stone-50 border border-dashed border-stone-300 rounded-md text-sm font-semibold text-stone-700 hover:bg-stone-100">
                  Kép kiválasztása
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try { setProfileData({ ...profileData, image: await convertFileToBase64(file) }); }
                      catch (err) { console.error('Profile image conversion error', err); }
                    }
                  }} />
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Kik vagyunk & Történetünk
              </label>
              <textarea
                rows={3}
                placeholder="Pl. Kőszegi hagyományőrző társaság vagyunk. Dédszüleink receptje alapján főzünk..."
                value={profileData.story}
                onChange={(e) => setProfileData({ ...profileData, story: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Kínálat összefoglaló (Mit főztek / kínáltok?) *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Pl. Bográcsos marhapörkölt, szüretes gulyásleves, rétesek..."
                value={profileData.offerings}
                onChange={(e) => setProfileData({ ...profileData, offerings: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-md border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Melyik napokon állítotok ki?
              </label>
              <select
                value={profileData.days}
                onChange={(e) => setProfileData({ ...profileData, days: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
              >
                <option value="both">Mindkét nap (Szombat és Vasárnap)</option>
                <option value="saturday">Csak Szombaton</option>
                <option value="sunday">Csak Vasárnap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Telefonszám (Opcionális)
              </label>
              <input
                type="text"
                placeholder="+36 30 123 4567"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email cím (Opcionális)
              </label>
              <input
                type="email"
                placeholder="csapat@koszeg.hu"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Facebook Link (Opcionális)
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/csapatnev"
                value={profileData.facebook_url}
                onChange={(e) => setProfileData({ ...profileData, facebook_url: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Instagram Link (Opcionális)
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/csapatnev"
                value={profileData.instagram_url}
                onChange={(e) => setProfileData({ ...profileData, instagram_url: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Adomány Célja (Kinek / Miért gyűjtünk?)
              </label>
              <input
                type="text"
                placeholder="Pl. A kőszegi gyermekmentők javára"
                value={profileData.cause}
                onChange={(e) => setProfileData({ ...profileData, cause: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-amber-50 p-3.5 rounded-md border border-amber-200">
            <div>
              <span className="font-extrabold text-amber-950 text-xs block">Ital kapható nálatok a standnál?</span>
              <span className="text-[11px] text-amber-800 font-medium">Ha bekapcsolod, az árus bekerül az "Italok" kategóriába és a térképre.</span>
            </div>

            <button
              type="button"
              onClick={() => setProfileData({ ...profileData, hasDrinks: !profileData.hasDrinks })}
              className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all border ${
                profileData.hasDrinks
                  ? 'bg-cyan-800 text-white border-cyan-900 shadow-xs'
                  : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              {profileData.hasDrinks ? 'Ital: BEKAPCSOLVA (ON)' : 'Ital: KIKAPCSOLVA (OFF)'}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs rounded-md shadow-xs"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Bemutatkozás & Adatok Mentése</span>
            </button>
          </div>
        </form>
      </div>

      {/* Dishes List & Stock Counter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-700" />
            <span>Főzött Ételeid ({exhibitorItems.length})</span>
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
          <div className="bg-white border border-stone-200 rounded-md p-8 text-center text-stone-500">
            <p className="text-xs font-medium">Még nem vettél fel ételt a standodhoz.</p>
            <button
              onClick={openNewDishModal}
              className="mt-3 px-4 py-2 bg-amber-800 text-white font-bold text-xs rounded-md"
            >
              + Új étel hozzáadása
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exhibitorItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200/90 rounded-md p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                          {item.available_day === 'saturday' ? 'Szombat' : item.available_day === 'sunday' ? 'Vasárnap' : 'Mindkét nap'}
                        </span>
                        {item.is_gluten_free && (
                          <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                            Gluténmentes
                          </span>
                        )}
                        {item.is_lactose_free && (
                          <span className="text-[9px] font-extrabold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-md border border-cyan-200">
                            Laktózmentes
                          </span>
                        )}
                        {item.is_sugar_free && (
                          <span className="text-[9px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                            Cukormentes
                          </span>
                        )}
                        {item.is_vegan && (
                          <span className="text-[9px] font-extrabold text-lime-800 bg-lime-100 px-2 py-0.5 rounded-md border border-lime-200">
                            Vegán
                          </span>
                        )}
                      </div>

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
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        item.status === 'ready'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Kész, kapható
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, 'cooking', 15)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        item.status === 'cooking'
                          ? 'bg-amber-800 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Főzés alatt
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, 'sold_out', 0)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        item.status === 'sold_out' || item.stock === 0
                          ? 'bg-rose-700 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Elfogyott
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

      {/* Super-Admin New Team Registration Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-md p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 rounded-md text-amber-900">
                <UserPlus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  Új Csapat Regisztrálása a Vásárra
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Add meg a csapat adatait! Az automatikusan generált 4 jegyű PIN kóddal tudnak belépni.
                </p>
              </div>
            </div>

            <form onSubmit={handleNewTeamSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
                  Csapat Neve * (Kötelező)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Kőszegi Öntelt Szakácsok"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-md text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
                  Mit főznek / Kínálat * (Kötelező)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Pl. Vasi tarhonyás hús, szüretes rétes, házi almalé..."
                  value={teamForm.offerings}
                  onChange={(e) => setTeamForm({ ...teamForm, offerings: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Kiállítás Napja
                  </label>
                  <select
                    value={teamForm.days}
                    onChange={(e) => setTeamForm({ ...teamForm, days: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
                  >
                    <option value="both">Mindkét nap (Szombat és Vasárnap)</option>
                    <option value="saturday">Csak Szombat</option>
                    <option value="sunday">Csak Vasárnap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Helyszín / Stand Száma
                  </label>
                  <input
                    type="text"
                    placeholder="Diáksétány 18."
                    value={teamForm.location}
                    onChange={(e) => setTeamForm({ ...teamForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Telefonszám (Opcionális)
                  </label>
                  <input
                    type="text"
                    placeholder="+36 30 111 2233"
                    value={teamForm.phone}
                    onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Email cím (Opcionális)
                  </label>
                  <input
                    type="email"
                    placeholder="info@csapat.hu"
                    value={teamForm.email}
                    onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Facebook URL (Opcionális)
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={teamForm.facebook_url}
                    onChange={(e) => setTeamForm({ ...teamForm, facebook_url: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Instagram URL (Opcionális)
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={teamForm.instagram_url}
                    onChange={(e) => setTeamForm({ ...teamForm, instagram_url: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs text-stone-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-900 hover:bg-amber-950 text-white font-extrabold text-xs rounded-md shadow-xs mt-2"
              >
                + Csapat Regisztrálása
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Team Created Success PIN Modal */}
      {createdTeamPinModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-md p-6 w-full max-w-sm text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800 border border-emerald-300">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-stone-900">
                Csapat Sikeresen Létrehozva!
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-1">
                {createdTeamPinModal.name} regisztrálva a rendszerbe.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-300 p-4 rounded-md">
              <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                BELÉPÉSI PIN KÓD:
              </span>
              <span className="text-3xl font-black text-amber-950 tracking-widest block my-1">
                {createdTeamPinModal.pin}
              </span>
              <span className="text-[11px] text-amber-800 font-medium block">
                Ezzel a 4 jegyű PIN kóddal tud belépni a csapat a Stand Kezelő felületre!
              </span>
            </div>

            <button
              onClick={() => setCreatedTeamPinModal(null)}
              className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs rounded-md shadow-xs"
            >
              Rendben, bezárás
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-md p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setIsDishModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-stone-900">
              {editingDish ? 'Étel Szerkesztése' : 'Új Étel Hozzáadása'}
            </h3>

            <form onSubmit={handleDishSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Étel Megnevezése *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Bográcsos Marhapörkölt"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Elérhetőség Napja
                  </label>
                  <select
                    value={dishForm.available_day}
                    onChange={(e) => setDishForm({ ...dishForm, available_day: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="both">Mindkét nap</option>
                    <option value="saturday">Szombat</option>
                    <option value="sunday">Vasárnap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Étel Kategóriája
                </label>
                <select
                  value={dishForm.category}
                  onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  <option value="meleg_etel">Meleg ételek</option>
                  <option value="hideg_etel">Hideg ételek</option>
                  <option value="sutemeny">Sütemény</option>
                  <option value="street_food">Street Food</option>
                  <option value="italok">Italok</option>
                  <option value="egyeb">Egyéb</option>
                </select>
              </div>

              {/* Allergen & Dietary Checkboxes */}
              <div className="bg-amber-50/70 p-3.5 rounded-md border border-amber-200/80 space-y-2">
                <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider block">
                  Étrendi Jellemzők / Mentes opciók:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={dishForm.is_gluten_free}
                      onChange={(e) => setDishForm({ ...dishForm, is_gluten_free: e.target.checked })}
                      className="rounded text-amber-800 focus:ring-amber-500"
                    />
                    <span>Gluténmentes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={dishForm.is_lactose_free}
                      onChange={(e) => setDishForm({ ...dishForm, is_lactose_free: e.target.checked })}
                      className="rounded text-amber-800 focus:ring-amber-500"
                    />
                    <span>Laktózmentes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={dishForm.is_sugar_free}
                      onChange={(e) => setDishForm({ ...dishForm, is_sugar_free: e.target.checked })}
                      className="rounded text-amber-800 focus:ring-amber-500"
                    />
                    <span>Cukormentes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={dishForm.is_vegan}
                      onChange={(e) => setDishForm({ ...dishForm, is_vegan: e.target.checked })}
                      className="rounded text-amber-800 focus:ring-amber-500"
                    />
                    <span>Vegán</span>
                  </label>
                </div>
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
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Étel fotó <span className="normal-case font-medium text-stone-400">(opcionális)</span></label>
                <div className="flex items-center gap-3">
                  {dishForm.image && <img src={dishForm.image} alt="" className="w-20 h-16 rounded-md object-contain bg-stone-950 border border-stone-200" />}
                  <label className="flex-1 cursor-pointer px-3 py-2.5 bg-stone-50 border border-dashed border-stone-300 rounded-md text-sm font-semibold text-stone-700 hover:bg-stone-100">
                    Fotó kiválasztása
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try { setDishForm({ ...dishForm, image: await convertFileToBase64(file) }); }
                        catch (err) { console.error('Dish image conversion error', err); }
                      }
                    }} />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs mt-2"
              >
                Étel Mentése
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
