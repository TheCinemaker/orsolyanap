import React, { useEffect, useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Plus, Camera, Heart, MapPin, X, Send, Sparkles, Check, User } from 'lucide-react';

export default function LiveReelBar() {
  const {
    reels,
    exhibitors,
    activeExhibitor,
    postReel,
    likeReel,
    convertFileToBase64,
    focusExhibitorOnMap,
    showToast,
    setActiveView
  } = useOrsolya();

  const [activeStoryModal, setActiveStoryModal] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Reel Form for Visitors & Exhibitors
  const [nameInput, setNameInput] = useState('');
  const [selectedExhibitorId, setSelectedExhibitorId] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedReelIds, setLikedReelIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orsolya_liked_reel_ids') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('orsolya_liked_reel_ids', JSON.stringify(likedReelIds)); }, [likedReelIds]);
  const uniqueReels = Array.from(new Map(reels.map((reel) => [String(reel.id), reel])).values());

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setImageInput(base64);
        showToast('📸 Fotó kiválasztva!', 'success');
      } catch (err) {
        showToast('Hiba a fotó feldolgozásakor', 'error');
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!captionInput.trim() || !imageInput) {
      showToast('Kérjük válassz fotót és írj hozzá leírást!', 'error');
      return;
    }

    setIsSubmitting(true);
    const posterName = nameInput.trim() || (activeExhibitor ? activeExhibitor.name : 'Vásári Látogató');
    const created = await postReel(captionInput, imageInput, posterName, selectedExhibitorId || null);
    setIsSubmitting(false);

    if (created) {
      setCaptionInput('');
      setImageInput('');
      setNameInput('');
      setSelectedExhibitorId('');
      setIsAddModalOpen(false);
    }
  };

  const formatTimeShort = (isoString) => {
    if (!isoString) return 'Éppen most';
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Éppen most';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}p`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}ó`;
    return `${date.getMonth() + 1}.${date.getDate()}.`;
  };

  // Only display reels from the last 1 hour on the main page bar (all reels are kept in Supabase)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentReels = reels.filter((r) => {
    const created = new Date(r.created_at).getTime();
    return !isNaN(created) ? created >= oneHourAgo : true;
  });

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-amber-950 uppercase tracking-widest flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-amber-700 animate-pulse" />
          <span>Élő Stand Pillanatok (Friss 1 óra)</span>
        </h3>
        <button
          onClick={() => setActiveView('reels')}
          className="text-[10px] font-black text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-full border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Összes Fotó ({reels.length})</span>
        </button>
      </div>

      {/* Horizontal Story Reel Bar (Facebook / Instagram Style) */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 px-1 scrollbar-none snap-x touch-pan-x">
        {/* ---------------------------------------------------------------- */}
        {/* CARD 1: ADD REEL BUTTON */}
        {/* ---------------------------------------------------------------- */}
        <div
          onClick={() => {
            setNameInput(activeExhibitor ? activeExhibitor.name : '');
            setIsAddModalOpen(true);
          }}
          className="flex-shrink-0 w-28 sm:w-32 h-44 sm:h-48 rounded-2xl bg-gradient-to-b from-amber-900 via-amber-950 to-stone-900 text-white relative overflow-hidden cursor-pointer group shadow-xs hover:shadow-md transition-all border-2 border-amber-600/40 snap-start flex flex-col justify-between p-2.5"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
              FOTÓ POSZTOLÁSA
            </span>
            <p className="text-xs font-extrabold leading-tight text-white">
              Élő Pillanat
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* REEL STORY CARDS (LAST 1 HOUR) */}
        {/* ---------------------------------------------------------------- */}
        {recentReels.map((reel) => {
          const exhibitor = exhibitors.find((e) => e.id === reel.exhibitor_id);
          const isExhibitorPost = !!reel.exhibitor_id;

          return (
            <div
              key={reel.id}
              onClick={() => setActiveStoryModal(reel)}
              className="flex-shrink-0 w-28 sm:w-32 h-44 sm:h-48 rounded-2xl relative overflow-hidden cursor-pointer group shadow-xs hover:shadow-md transition-all snap-start border border-stone-300 bg-stone-900"
            >
              {/* Background Photo */}
              <img
                src={reel.image}
                alt={reel.caption}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

              {/* Top Exhibitor / Visitor Ring Badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className={`w-8 h-8 rounded-full border-2 p-0.5 overflow-hidden shadow-md flex items-center justify-center text-white text-[10px] font-black uppercase ${
                  isExhibitorPost ? 'bg-amber-900 border-amber-400' : 'bg-emerald-900 border-emerald-400'
                }`}>
                  {exhibitor?.image ? (
                    <img src={exhibitor.image} alt="" className="w-full h-full rounded-full object-contain bg-stone-950" />
                  ) : (
                    <span>{reel.exhibitor_name?.substring(0, 2).toUpperCase() || 'LÁ'}</span>
                  )}
                </div>
              </div>

              {/* Like counter badge */}
              {(reel.likes || 0) > 0 && <div className="absolute top-2 right-2 z-10 bg-stone-900/80 backdrop-blur-xs text-rose-300 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 border border-rose-500/30">
                <Heart className={`w-3 h-3 ${likedReelIds.includes(reel.id) ? 'fill-rose-500 text-rose-500' : 'text-rose-300'}`} />
                <span>{reel.likes}</span>
              </div>}

              {/* Bottom Caption & Time */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 text-white space-y-0.5">
                <p className="text-[11px] font-extrabold leading-snug line-clamp-2 drop-shadow-md text-amber-100">
                  {reel.caption}
                </p>
                <div className="flex items-center justify-between text-[9px] font-semibold text-stone-300">
                  <span className="truncate max-w-[70px]">{reel.exhibitor_name}</span>
                  <span className="text-amber-300 font-bold">{formatTimeShort(reel.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* ADD REEL MODAL (FOR VISITORS & EXHIBITORS) */}
      {/* ---------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl border border-amber-300">
                <Camera className="w-5 h-5 text-amber-800" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  📸 Élő Vásári Fotó Posztolása
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Posztolj egy fotót a hangulatról, ételekről vagy a standról!
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 pt-1">
              {/* Photo Input */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Fotó Kiválasztása / Készítése *
                </label>
                {imageInput ? (
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-stone-300 bg-stone-950 flex items-center justify-center">
                    <img src={imageInput} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setImageInput('')}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-2xl p-6 text-center cursor-pointer bg-stone-50 hover:bg-amber-50/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                      id="reelFileInput"
                    />
                    <label htmlFor="reelFileInput" className="cursor-pointer space-y-2 block">
                      <Camera className="w-8 h-8 text-amber-800 mx-auto" />
                      <span className="text-xs font-extrabold text-stone-800 block">
                        Kattints ide fotó készítéséhez vagy feltöltéséhez
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Poster Name */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Neved / Beceneved (Opcionális)
                </label>
                <input
                  type="text"
                  placeholder="pl. Péter / Kőszegi Látogató"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Stand selection */}
              {exhibitors.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Melyik standnál / csapatnál jársz? (Opcionális)
                  </label>
                  <select
                    value={selectedExhibitorId}
                    onChange={(e) => setSelectedExhibitorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                  >
                    <option value="">Általános vásári hangulat</option>
                    {exhibitors.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Rövid Élmény / Leírás *
                </label>
                <input
                  type="text"
                  required
                  placeholder="pl. Isteni finom a gulyásleves! Szuper a hangulat!"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Posztolás az Élő Feedbe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* FULLSCREEN STORY VIEWER MODAL */}
      {/* ---------------------------------------------------------------- */}
      {activeStoryModal && (
        <div
          onClick={() => setActiveStoryModal(null)}
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-900 text-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative border border-stone-800 flex flex-col justify-between h-[80vh] max-h-[650px]"
          >
            {/* Top Bar Header */}
            <div className="p-4 bg-gradient-to-b from-stone-950/80 to-transparent z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center border-2 border-amber-300">
                  {activeStoryModal.exhibitor_name?.substring(0, 2).toUpperCase() || 'LÁ'}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white leading-tight">
                    {activeStoryModal.exhibitor_name}
                  </h4>
                  <p className="text-[10px] text-amber-300 font-bold">
                    {formatTimeShort(activeStoryModal.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryModal(null)}
                className="p-1.5 bg-stone-800/80 hover:bg-stone-700 rounded-full text-stone-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story Image */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
              <img
                src={activeStoryModal.image}
                alt={activeStoryModal.caption}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bottom Caption & Action Bar */}
            <div className="p-4 bg-stone-900 border-t border-stone-800 space-y-3">
              <p className="text-sm font-black text-amber-100 leading-snug">
                "{activeStoryModal.caption}"
              </p>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => {
                    if (likedReelIds.includes(activeStoryModal.id)) return;
                    setLikedReelIds((prev) => [...prev, activeStoryModal.id]);
                    likeReel(activeStoryModal.id);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${likedReelIds.includes(activeStoryModal.id) ? "fill-white" : ""}`} />
                  <span>{activeStoryModal.likes || 0} Kedvelés</span>
                </button>

                {exhibitors.find((e) => e.id === activeStoryModal.exhibitor_id) && (
                  <button
                    onClick={() => {
                      focusExhibitorOnMap(activeStoryModal.exhibitor_id);
                      setActiveStoryModal(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Stand a térképen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
