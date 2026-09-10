import React, { useState, useMemo } from 'react';
import { useOrsolya, formatPrice } from '../context/OrsolyaContext';
import {
  Utensils,
  MapPin,
  ThumbsUp,
  Flame,
  Info,
  Trophy,
  Tag,
  ChevronDown,
  ChevronUp,
  Cake,
  Cookie,
  CupSoda,
  Package,
  Sparkles
} from 'lucide-react';

const CATEGORY_SECTIONS = [
  { id: 'meleg_etel', title: 'Meleg ételek', icon: Flame },
  { id: 'hideg_etel', title: 'Hideg ételek', icon: Utensils },
  { id: 'sutemeny', title: 'Sütemény / Édesség', icon: Cake },
  { id: 'street_food', title: 'Street Food', icon: Cookie },
  { id: 'italok', title: 'Italok (Alkoholos / Mentes)', icon: CupSoda },
  { id: 'egyeb', title: 'Egyéb', icon: Package }
];

export default function FoodCatalogView({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const {
    menuItems,
    exhibitors,
    votedItemIds,
    voteForItem,
    selectedDay,
    setSelectedDay,
    isLoadingData
  } = useOrsolya();

  // Collapsible section open/closed state (default: all open)
  const [closedSections, setClosedSections] = useState({});

  const toggleSection = (catId) => {
    setClosedSections((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Filter items matching search & day
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
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

      const itemDay = item.available_day || 'both';
      const exDay = exhibitor?.days || 'both';
      const matchesDay =
        selectedDay === 'all' ||
        itemDay === 'both' ||
        itemDay === selectedDay ||
        (exDay !== 'both' && exDay === selectedDay);

      return matchesSearch && matchesDay;
    });
  }, [menuItems, exhibitors, searchQuery, selectedDay]);

  // Fair Randomized Shuffle of items on each load so exhibitors get equal top exposure
  const randomizedItems = useMemo(() => {
    const list = [...filteredItems];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [filteredItems]);

  const renderDishCard = (item) => {
    const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);
    const isVoted = votedItemIds.includes(item.id);
    const isTopVoted = (item.votes || 0) >= 40;

    return (
      <div
        key={item.id}
        className="bg-white border border-stone-200/90 rounded-md p-3.5 shadow-2xs hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-2.5 relative group"
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
          <div className="w-full aspect-video rounded-md overflow-hidden my-1 border border-stone-200 bg-stone-950 flex items-center justify-center">
            <img src={item.image} alt={item.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
          </div>
        )}

        {/* Title & Description & Price */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 flex-wrap">
            {item.status === 'sold_out' || item.stock === 0 ? (
              <span className="text-[10px] font-black text-white bg-rose-700 px-2 py-0.5 rounded border border-rose-800 uppercase tracking-wider animate-pulse">
                ELFOGYOTT
              </span>
            ) : item.status === 'cooking' ? (
              <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                FŐZÉS ALATT
              </span>
            ) : null}

            <span className="text-[9px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
              {item.available_day === 'saturday' ? 'Szombat' : item.available_day === 'sunday' ? 'Vasárnap' : 'Mindkét nap'}
            </span>
            {item.is_gluten_free && (
              <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                GM
              </span>
            )}
            {item.is_lactose_free && (
              <span className="text-[9px] font-extrabold text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-200">
                LM
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-extrabold text-xs sm:text-sm leading-snug transition-colors ${
              item.status === 'sold_out' || item.stock === 0 ? 'text-stone-400 line-through' : 'text-stone-900 group-hover:text-amber-800'
            }`}>
              {item.name}
            </h3>
            <span className="shrink-0 text-[11px] font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-700" />
              <span>{formatPrice(item.price)}</span>
            </span>
          </div>
          {item.description && (
            <p className={`text-[11px] line-clamp-2 leading-relaxed font-medium ${
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
              <span key={t} className="text-[9px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-semibold">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Footer Action Bar: Vote Button */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            onClick={() => voteForItem(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-extrabold transition-all border shadow-2xs cursor-pointer ${
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
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200/90 rounded-md p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
              KATALÓGUS NÉZET & KÖZÖNSÉGSZAVAZÁS
            </span>
            <h2 className="text-base font-extrabold text-stone-900 mt-0.5 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-700" />
              <span>Civil Ízek Utcája • Ételek/italok katalógusa ({randomizedItems.length} találat)</span>
            </h2>
          </div>

          {/* Day Switcher Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-md border border-stone-200 self-stretch sm:self-auto">
            <button
              onClick={() => setSelectedDay('all')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                selectedDay === 'all'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mindkét nap
            </button>
            <button
              onClick={() => setSelectedDay('saturday')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                selectedDay === 'saturday'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Szombat
            </button>
            <button
              onClick={() => setSelectedDay('sunday')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                selectedDay === 'sunday'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Vasárnap
            </button>
          </div>
        </div>
      </div>

      {/* Dishes Content */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-md p-4 space-y-3">
              <div className="h-4 bg-stone-200 rounded w-1/2"></div>
              <div className="w-full aspect-video bg-stone-200 rounded-md"></div>
              <div className="h-5 bg-stone-200 rounded w-3/4"></div>
              <div className="h-4 bg-stone-200 rounded w-full"></div>
              <div className="h-9 bg-stone-200 rounded-md"></div>
            </div>
          ))}
        </div>
      ) : randomizedItems.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-md p-8 text-center text-stone-400 space-y-2">
          <Info className="w-8 h-8 mx-auto opacity-40 text-amber-800" />
          <p className="text-sm font-bold text-stone-700">Nincs a szűrésnek megfelelő étel vagy ital.</p>
          <button
            onClick={() => {
              if (setSelectedCategory) setSelectedCategory('all');
              setSelectedDay('all');
              if (setSearchQuery) setSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-800 text-white text-xs font-bold rounded-md mt-2 cursor-pointer"
          >
            Szűrők alaphelyzetbe állítása
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Ultra-thin Minimalist Collapsible Category Accordion Sections */}
          {CATEGORY_SECTIONS.map((section) => {
            const isDrinkSection = section.id === 'italok';
            const sectionItems = randomizedItems.filter((i) => {
              if (isDrinkSection) return i.category === 'italok' || i.category === 'ital';
              return i.category === section.id;
            });

            if (sectionItems.length === 0) return null;

            const IconComp = section.icon;
            const isClosed = !!closedSections[section.id];

            return (
              <div key={section.id} className="bg-white border border-stone-200 rounded-md overflow-hidden shadow-2xs">
                {/* Ultra-thin Header Bar (Szöveg ---------------- Lenyitás gomb) */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between py-2 px-3 sm:px-4 bg-stone-50 hover:bg-amber-50/80 transition-colors cursor-pointer border-b border-stone-200/60 group"
                >
                  <div className="flex items-center gap-2">
                    <IconComp className="w-4 h-4 text-amber-800" />
                    <span className="font-extrabold text-stone-900 uppercase tracking-wider text-xs sm:text-xs">
                      {section.title}
                    </span>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                      {sectionItems.length} db
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 group-hover:text-amber-900 transition-colors">
                    <span>{isClosed ? 'Lenyitás' : 'Összecsukás'}</span>
                    {isClosed ? (
                      <ChevronDown className="w-4 h-4 text-stone-700" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-stone-700" />
                    )}
                  </div>
                </button>

                {/* Section Items Grid */}
                {!isClosed && (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-150">
                    {sectionItems.map((item) => renderDishCard(item))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized fallback items section */}
          {(() => {
            const definedCatIds = ['meleg_etel', 'hideg_etel', 'sutemeny', 'street_food', 'italok', 'ital', 'egyeb'];
            const uncategorized = randomizedItems.filter((i) => !definedCatIds.includes(i.category));
            if (uncategorized.length === 0) return null;
            return (
              <div className="bg-white border border-stone-200 rounded-md overflow-hidden shadow-2xs">
                <div className="py-2 px-3 sm:px-4 bg-stone-50 border-b border-stone-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-800" />
                    <span className="font-extrabold text-stone-900 uppercase tracking-wider text-xs">
                      Egyéb termékek ({uncategorized.length})
                    </span>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uncategorized.map((item) => renderDishCard(item))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
