import React, { useState, useEffect } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Heart, MapPin, ChevronDown } from 'lucide-react';

export default function ReelsGallery() {
  const { reels, exhibitors, likeReel, setActiveView, focusExhibitorOnMap } = useOrsolya();
  
  const [likedReelIds, setLikedReelIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orsolya_liked_reel_ids') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('orsolya_liked_reel_ids', JSON.stringify(likedReelIds));
  }, [likedReelIds]);

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

  const handleLike = (id) => {
    if (likedReelIds.includes(id)) return;
    setLikedReelIds(prev => [...prev, id]);
    likeReel(id);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col h-[100dvh] overflow-hidden">
      {/* Top Header / Close Button */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <h2 className="text-sm font-black tracking-widest text-white drop-shadow-md">
          ÖSSZES FOTÓ
        </h2>
        <button
          onClick={() => setActiveView('visitor')}
          className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors cursor-pointer shadow-lg pointer-events-auto"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Vertical Snap Scroll Container (TikTok style) */}
      <div className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-none h-full w-full bg-stone-950">
        {reels.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/50 text-sm font-bold">
            Még nincsenek fotók.
          </div>
        )}

        {reels.map((reel, index) => {
          const exhibitor = exhibitors.find((e) => e.id === reel.exhibitor_id);
          const isLiked = likedReelIds.includes(reel.id);

          return (
            <div key={reel.id} className="snap-start snap-always w-full h-[100dvh] relative flex items-center justify-center bg-black">
              
              {/* Background Fullscreen Image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={reel.image}
                  alt={reel.caption}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Interaction Overlay Layer */}
              <div 
                className="absolute inset-0 z-10"
                onDoubleClick={() => handleLike(reel.id)}
              >
                {/* Gradient at bottom for text readability */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                
                {/* Floating Right Actions Menu */}
                <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 pointer-events-auto">
                  
                  {/* Like Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => handleLike(reel.id)}
                      className={`p-3 rounded-full backdrop-blur-md transition-transform shadow-lg cursor-pointer ${isLiked ? 'bg-rose-500/20' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      <Heart className={`w-8 h-8 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">
                      {reel.likes || 0}
                    </span>
                  </div>

                  {/* Exhibitor Map Button */}
                  {exhibitor && (
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => {
                          setActiveView('map');
                          setTimeout(() => focusExhibitorOnMap(exhibitor.id), 100);
                        }}
                        className="p-3 rounded-full bg-amber-500/90 hover:bg-amber-400 backdrop-blur-md text-stone-950 transition-transform shadow-lg cursor-pointer"
                      >
                        <MapPin className="w-8 h-8" />
                      </button>
                      <span className="text-white text-xs font-bold drop-shadow-md">
                        Stand
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Info Section */}
                <div className="absolute bottom-6 left-4 right-20 space-y-2 pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center border-2 border-white shadow-lg overflow-hidden">
                      {exhibitor?.image ? (
                        <img src={exhibitor.image} alt="" className="w-full h-full object-contain bg-white" />
                      ) : (
                        <span>{reel.exhibitor_name?.substring(0, 2).toUpperCase() || 'LÁ'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-sm drop-shadow-md">
                        {reel.exhibitor_name}
                      </h3>
                      <p className="text-xs text-white/80 font-bold drop-shadow-md">
                        {formatTimeShort(reel.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {reel.caption && (
                    <p className="text-sm font-medium text-white line-clamp-3 drop-shadow-md pr-4">
                      {reel.caption}
                    </p>
                  )}
                </div>

                {/* Scroll Indicator */}
                {index < reels.length - 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-60 pointer-events-none">
                    <ChevronDown className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
