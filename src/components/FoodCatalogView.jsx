import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, ThumbsUp, Flame, Search, Info, CheckCircle2, Heart, Trophy } from 'lucide-react';

export default function FoodCatalogView({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const { menuItems, exhibitors, votedItemIds, voteForItem } = useOrsolya();

  const filteredItems = menuItems.filter((item) => {
    const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);
    const exName = exhibitor ? exhibitor.name.toLowerCase() : '';
    const exLoc = exhibitor ? exhibitor.location.toLowerCase() : '';

    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      exName.includes(searchQuery.toLowerCase()) ||
      exLoc.includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
              KATALÓGUS NÉZET & KÖZÖNSÉGSZAVAZÁS
            </span>
            <h2 className="text-lg font-extrabold text-stone-900 mt-1 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-700" />
              <span>Civil Ízek Utcája • Ételek Katalógusa ({filteredItems.length} étel)</span>
            </h2>
          </div>

          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
            {menuItems.length} étel összesen
          </span>
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-400">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold text-stone-700">Nincs a keresésnek megfelelő étel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);
            const isVoted = votedItemIds.includes(item.id);
            const isTopVoted = (item.votes || 0) >= 40;

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-stone-200 hover:border-stone-900 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
              >
                {/* Stand Info Badge & Top Voted */}
                {exhibitor && (
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white bg-stone-900 px-2.5 py-0.5 rounded-full border border-stone-950 inline-flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-amber-400" />
                      <span className="truncate">{exhibitor.name}</span>
                    </span>

                    {isTopVoted && (
                      <span className="text-[9px] font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-400">
                        <Trophy className="w-2.5 h-2.5 text-amber-800" /> Kedvenc
                      </span>
                    )}
                  </div>
                )}

                {/* Title & Description */}
                <div className="space-y-1">
                  <h3 className="font-black text-stone-950 text-sm sm:text-base leading-snug group-hover:text-amber-900 transition-colors">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs font-bold text-stone-700 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span key={t} className="text-[10px] text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md font-black border border-stone-300">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Action Bar: Donation Info + Vote Button */}
                <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-black text-amber-950">
                    <Heart className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
                    <span>Adományos kóstolás</span>
                  </div>

                  <button
                    onClick={() => voteForItem(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border shadow-2xs ${
                      isVoted
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300/80'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
                    <span>{isVoted ? `Szavazva (${item.votes || 1})` : `Szavazok (${item.votes || 0})`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
