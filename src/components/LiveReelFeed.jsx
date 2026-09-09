import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Camera, Heart, MapPin, Store, Sparkles, Clock, Flame, Image as ImageIcon } from 'lucide-react';

export default function LiveReelFeed() {
  const { reels, exhibitors, likeReel, focusExhibitorOnMap, setActiveView } = useOrsolya();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const uniqueReels = Array.from(new Map(reels.map((reel) => [String(reel.id), reel])).values());

  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Éppen most';
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Éppen most';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} perce`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} órája`;
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 bg-amber-900/80 px-3 py-1 rounded-full border border-amber-700/60 inline-flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>VALÓS IDEJŰ HÍRFOLYAM & FOTÓK</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            📸 Élő Stand Pillanatok & Reels
          </h2>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            Kukkants be a rotyogó bográcsok mellé! Az árusok és csapatok valós időben posztolják a frissen kisült ételeket és fotókat.
          </p>
        </div>

        <button
          onClick={() => setActiveView('login')}
          className="z-10 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Árus Posztolása</span>
        </button>
      </div>

      {/* Reels Feed Grid */}
      {uniqueReels.length === 0 ? (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 mx-auto bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center border border-amber-300">
            <Camera className="w-7 h-7 text-amber-800" />
          </div>
          <h3 className="text-base font-extrabold text-stone-900">
            Még nem posztoltak élő pillanatot az árusok!
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Az Orsolya-napi árusok a Stand Irányítópultról 1 kattintással tudnak friss fotókat és bejelentkezéseket közzétenni a látogatóknak.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {uniqueReels.map((reel) => {
            const exhibitor = exhibitors.find((e) => e.id === reel.exhibitor_id);

            return (
              <div
                key={reel.id}
                className="bg-white border border-stone-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Header info */}
                <div className="p-3.5 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-950 font-extrabold text-xs flex items-center justify-center border border-amber-300 flex-shrink-0 overflow-hidden">
                      {exhibitor?.image ? (
                        <img src={exhibitor.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{reel.exhibitor_name?.substring(0, 2).toUpperCase() || 'ÁR'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-stone-900 truncate">
                        {reel.exhibitor_name}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-700" />
                        <span>{exhibitor?.location || 'Diáksétány'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-1 rounded-lg border border-stone-200 flex-shrink-0">
                    {formatTimeAgo(reel.created_at)}
                  </span>
                </div>

                {/* Photo image */}
                <div
                  onClick={() => setSelectedPhoto(reel)}
                  className="relative aspect-4/3 overflow-hidden cursor-pointer bg-stone-900 group"
                >
                  <img
                    src={reel.image}
                    alt={reel.caption}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent opacity-80" />
                  <p className="absolute bottom-3 left-3.5 right-3.5 text-white font-extrabold text-xs sm:text-sm drop-shadow-md leading-snug line-clamp-2">
                    {reel.caption}
                  </p>
                </div>

                {/* Footer actions */}
                <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-stone-100">
                  <button
                    onClick={() => likeReel(reel.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 font-extrabold text-xs rounded-xl border border-rose-200 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                    <span>{reel.likes || 0} Kedvelés</span>
                  </button>

                  {exhibitor && (
                    <button
                      onClick={() => focusExhibitorOnMap(exhibitor.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-200 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-800" />
                      <span>Stand Térkép</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Modal Zoom */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0"
          >
            <div className="relative max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.caption}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-5 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  {selectedPhoto.exhibitor_name}
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {formatTimeAgo(selectedPhoto.created_at)}
                </span>
              </div>
              <p className="text-sm font-extrabold text-stone-900 leading-relaxed">
                {selectedPhoto.caption}
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <button
                  onClick={() => likeReel(selectedPhoto.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-900 font-extrabold text-xs rounded-xl border border-rose-200"
                >
                  <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                  <span>{selectedPhoto.likes || 0} Kedvelés</span>
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl"
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
