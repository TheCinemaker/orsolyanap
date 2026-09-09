import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, ThumbsUp, Flame, Info, Heart, Trophy, Calendar, Sparkles } from 'lucide-react';

export default function FoodCatalogView({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const {
    menuItems,
    exhibitors,
    votedItemIds,
    voteForItem,
    selectedDay,
    setSelectedDay,
    selectedDietary,
    setSelectedDietary
  } = useOrsolya();

  const filteredItems = menuItems.filter((item) => {
    const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);
    const exName = exhibitor ? exhibitor.name.toLowerCase() : '';
    const exLoc = exhibitor ? exhibitor.location.toLowerCase() : '';

    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      exName.includes(searchQuery.toLowerCase()) ||
      exLoc.includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    // Day filtering logic: check item's available_day and exhibitor's days
    const itemDay = item.available_day || 'both';
    const exDay = exhibitor?.days || 'both';
    const matchesDay =
      selectedDay === 'all' ||
      itemDay === 'both' ||
      itemDay === selectedDay ||
      (exDay !== 'both' && exDay === selectedDay);

    // Dietary filtering logic
    let matchesDietary = true;
    if (selectedDietary === 'gluten_free') matchesDietary = !!item.is_gluten_free;
    if (selectedDietary === 'lactose_free') matchesDietary = !!item.is_lactose_free;
    if (selectedDietary === 'sugar_free') matchesDietary = !!item.is_sugar_free;
    if (selectedDietary === 'vegan') matchesDietary = !!item.is_vegan;

    return matchesSearch && matchesCategory && matchesDay && matchesDietary;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
              KATALÓGUS NÉZET & KÖZÖNSÉGSZAVAZÁS
            </span>
            <h2 className="text-lg font-extrabold text-stone-900 mt-1 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-700" />
              <span>Civil Ízek Utcája • Ételek Katalógusa ({filteredItems.length} találat)</span>
            </h2>
          </div>

          {/* Day Switcher Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 self-stretch sm:self-auto">
            <button
              onClick={() => setSelectedDay('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDay === 'all'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mindkét nap
            </button>
            <button
              onClick={() => setSelectedDay('saturday')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDay === 'saturday'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Szombat
            </button>
            <button
              onClick={() => setSelectedDay('sunday')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDay === 'sunday'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Vasárnap
            </button>
          </div>
        </div>

        {/* Dietary Allergen Filter Bar */}
        <div className="pt-3 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-amber-600" /> Étrendi szűrő:
          </span>

          <button
            onClick={() => setSelectedDietary('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 border ${
              selectedDietary === 'all'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            Összes étel
          </button>

          <button
            onClick={() => setSelectedDietary('gluten_free')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 border ${
              selectedDietary === 'gluten_free'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Gluténmentes
          </button>

          <button
            onClick={() => setSelectedDietary('lactose_free')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 border ${
              selectedDietary === 'lactose_free'
                ? 'bg-cyan-800 text-white border-cyan-900 shadow-xs'
                : 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            Laktózmentes
          </button>

          <button
            onClick={() => setSelectedDietary('sugar_free')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 border ${
              selectedDietary === 'sugar_free'
                ? 'bg-purple-800 text-white border-purple-900 shadow-xs'
                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
            }`}
          >
            Cukormentes
          </button>

          <button
            onClick={() => setSelectedDietary('vegan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 border ${
              selectedDietary === 'vegan'
                ? 'bg-lime-800 text-white border-lime-900 shadow-xs'
                : 'bg-lime-50 text-lime-900 border-lime-200 hover:bg-lime-100'
            }`}
          >
            Vegán
          </button>
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-400 space-y-2">
          <Info className="w-8 h-8 mx-auto opacity-40 text-amber-800" />
          <p className="text-sm font-bold text-stone-700">Nincs a szűrésnek megfelelő étel.</p>
          <button
            onClick={() => {
              setSelectedDietary('all');
              setSelectedDay('all');
              if (setSearchQuery) setSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-800 text-white text-xs font-bold rounded-xl mt-2"
          >
            Szűrők alaphelyzetbe állítása
          </button>
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
                className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-3 relative group"
              >
                {/* Stand Info Badge & Top Voted */}
                {exhibitor && (
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/60 inline-flex items-center gap-1 truncate max-w-[70%]">
                      <MapPin className="w-2.5 h-2.5 text-amber-700 flex-shrink-0" />
                      <span className="truncate">{exhibitor.name}</span>
                    </span>

                    {isTopVoted && (
                      <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                        <Trophy className="w-2.5 h-2.5 text-amber-700" /> Kedvenc
                      </span>
                    )}
                  </div>
                )}

                {/* Item Image */}
                {item.image && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden mt-2 mb-2 border border-stone-200 bg-stone-950 flex items-center justify-center">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                )}

                {/* Title & Description */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    {item.status === 'sold_out' || item.stock === 0 ? (
                      <span className="text-[10px] font-black text-white bg-rose-700 px-2.5 py-0.5 rounded-md border border-rose-800 uppercase tracking-wider animate-pulse">
                        ELFOGYOTT
                      </span>
                    ) : item.status === 'cooking' ? (
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                        FŐZÉS ALATT
                      </span>
                    ) : null}

                    <span className="text-[9px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      {item.available_day === 'saturday' ? 'Szombat' : item.available_day === 'sunday' ? 'Vasárnap' : 'Mindkét nap'}
                    </span>
                    {item.is_gluten_free && (
                      <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-200">
                        Gluténmentes
                      </span>
                    )}
                    {item.is_lactose_free && (
                      <span className="text-[9px] font-extrabold text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded-md border border-cyan-200">
                        Laktózmentes
                      </span>
                    )}
                    {item.is_sugar_free && (
                      <span className="text-[9px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded-md border border-purple-200">
                        Cukormentes
                      </span>
                    )}
                    {item.is_vegan && (
                      <span className="text-[9px] font-extrabold text-lime-800 bg-lime-100 px-1.5 py-0.5 rounded-md border border-lime-200">
                        Vegán
                      </span>
                    )}
                  </div>

                  <h3 className={`font-extrabold text-sm sm:text-base leading-snug transition-colors ${
                    item.status === 'sold_out' || item.stock === 0 ? 'text-stone-400 line-through' : 'text-stone-900 group-hover:text-amber-800'
                  }`}>
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className={`text-xs line-clamp-2 leading-relaxed font-medium ${
                      item.status === 'sold_out' || item.stock === 0 ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span key={t} className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Action Bar: Vote Button */}
                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => voteForItem(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border shadow-2xs ${
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
