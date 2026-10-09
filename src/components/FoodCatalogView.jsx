import React, { useState, useMemo, useEffect } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import DishLocationModal from './DishLocationModal';
import {
  Utensils,
  MapPin,
  ThumbsUp,
  Flame,
  Info,
  Trophy,
  ChevronDown,
  ChevronUp,
  Cake,
  Cookie,
  CupSoda,
  Package,
  Sparkles,
  Heart,
  X
} from 'lucide-react';

const CATEGORY_SECTIONS = [
  { id: 'meleg_etel', title: 'Meleg ételek', icon: Flame },
  { id: 'hideg_etel', title: 'Hideg ételek', icon: Utensils },
  { id: 'sutemeny', title: 'Sütemény / Édesség', icon: Cake },
  { id: 'street_food', title: 'Street Food', icon: Cookie },
  { id: 'italok', title: 'Italok', icon: CupSoda },
  { id: 'egyeb', title: 'Egyéb', icon: Package }
];

export default function FoodCatalogView({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const {
    menuItems,
    exhibitors,
    votedItemIds,
    voteForItem,
    favoriteItemIds,
    toggleFavoriteItem,
    selectedDay,
    setSelectedDay,
    isLoadingData,
    isItemVisibleToVisitors
  } = useOrsolya();

  // Lenyíló szekciók állapota.
  //
  // ALAPBÓL CSUKVA: a csukott fejléc mutatja meg, hogy van mit kinyitni.
  // Ha minden nyitva van, a felhasználó nem feltétlenül jön rá, hogy
  // össze is lehet csukni.
  //
  // Három állapot: true = kézzel kinyitva, false = kézzel becsukva,
  // undefined = nem nyúlt hozzá. Erre azért van szükség, mert keresés
  // közben a találatokat NEM rejthetjük csukott szekciók mögé -- aki
  // rákeresett a pörköltre, annak látnia kell -, de ha ott kézzel
  // becsukja, az a döntése maradjon érvényben.
  const [openSections, setOpenSections] = useState({});
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'all');
  const [activeTag, setActiveTag] = useState('all');
  const [showAllTags, setShowAllTags] = useState(false);

  // Location modal state ({ item, exhibitor })
  const [selectedLocationModalData, setSelectedLocationModalData] = useState(null);

  useEffect(() => {
    setActiveCategory(selectedCategory || 'all');
  }, [selectedCategory]);

  const toggleSection = (catId, isOpenNow) => {
    setOpenSections((prev) => ({
      ...prev,
      [catId]: !isOpenNow
    }));
  };

  const availableTags = useMemo(() => {
    const counts = new Map();
    menuItems.forEach((item) => {
      (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'hu'));
  }, [menuItems]);

  const categoryFilters = CATEGORY_SECTIONS.filter((section) =>
    menuItems.some((item) => item.category === section.id || (section.id === 'italok' && item.category === 'ital'))
  );

  const exhibitorById = useMemo(() => new Map(exhibitors.map((ex) => [ex.id, ex])), [exhibitors]);
  const visibleTags = showAllTags ? availableTags : availableTags.slice(0, 8);

  // Filter items matching search, day, category, tag and visitor visibility

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const exhibitor = exhibitorById.get(item.exhibitor_id);
      const exName = exhibitor?.name?.toLowerCase?.() || '';
      const exLoc = exhibitor?.location?.toLowerCase?.() || '';

      const matchesVisibility = isItemVisibleToVisitors ? isItemVisibleToVisitors(item) : !item.is_hidden;
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory || (activeCategory === 'italok' && item.category === 'ital');
      const matchesTag = activeTag === 'all' || (item.tags || []).includes(activeTag);

      const matchesSearch =
        !searchQuery ||
        item.name?.toLowerCase?.().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase?.().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some((t) => t?.toLowerCase?.().includes(searchQuery.toLowerCase()))) ||
        exName.includes(searchQuery.toLowerCase()) ||
        exLoc.includes(searchQuery.toLowerCase());

      const itemDay = item.available_day || 'both';
      const exDay = exhibitor?.days || 'both';
      const matchesDay =
        selectedDay === 'all' ||
        itemDay === 'both' ||
        itemDay === selectedDay ||
        (exDay !== 'both' && exDay === selectedDay);

      return matchesVisibility && matchesSearch && matchesDay && matchesCategory && matchesTag;
    });
  }, [menuItems, exhibitors, searchQuery, selectedDay, activeCategory, activeTag, isItemVisibleToVisitors]);

  // Stable ordering: first by category, then by exhibitor, then by dish name.
  const sortedItems = useMemo(() => {
    const categoryOrder = { meleg_etel: 1, street_food: 2, sutemeny: 3, italok: 4, ital: 4, hideg_etel: 5, egyeb: 6 };
    return [...filteredItems].sort((a, b) => {
      const cat = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
      if (cat !== 0) return cat;
      const exA = exhibitors.find((ex) => ex.id === a.exhibitor_id)?.name || '';
      const exB = exhibitors.find((ex) => ex.id === b.exhibitor_id)?.name || '';
      const ex = exA.localeCompare(exB, 'hu');
      return ex !== 0 ? ex : a.name.localeCompare(b.name, 'hu');
    });
  }, [filteredItems, exhibitors]);

  const renderDishCard = (item) => {
    const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);
    const isVoted = votedItemIds.includes(item.id);
    const isFavItem = favoriteItemIds?.includes(item.id);
    const isTopVoted = (item.votes || 0) >= 40;

    return (
      <div
        key={item.id}
        className="bg-white border border-stone-200/90 rounded-md p-3.5 shadow-2xs hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-2.5 relative group"
      >
        {/* Stand neve: teljes szélességű sáv, csak kicsit lekerekítve.
            A pill alak kicsi, kerek szigetet csinált belőle a kártya tetején;
            így egy fejléc-sávként olvasódik. A "Kedvenc" jelvény mellé kerül,
            amikor van -- az ritka (40 szavazat felett), tehát a sáv a legtöbb
            kártyán tényleg a teljes szélességet kapja. */}
        {exhibitor && (
          <div className="flex items-center gap-1.5">
            <span className="flex-1 min-w-0 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded border border-amber-300/60 inline-flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-amber-700 flex-shrink-0" />
              <span className="truncate">{exhibitor.name}</span>
            </span>

            {isTopVoted && (
              <span className="shrink-0 text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-1 rounded flex items-center gap-1 border border-amber-300">
                <Trophy className="w-2.5 h-2.5 text-amber-700" /> Kedvenc
              </span>
            )}
          </div>
        )}

        {/* Item Image */}
        {item.image ? (
          <div className="relative w-full aspect-video rounded-md overflow-hidden my-1 border border-stone-200 bg-stone-950 flex items-center justify-center">
            <img src={item.image} alt={item.name} loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 sm:group-hover:scale-105" />
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-stone-950/70 text-[9px] font-bold uppercase tracking-wider text-white/90 pointer-events-none">
              AI illusztráció
            </span>
          </div>
        ) : (
          <div className="w-full aspect-video rounded-md my-1 border border-stone-200 bg-stone-100 flex items-center justify-center text-stone-400">
            <Utensils className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 flex-wrap">
            {item.status === 'sold_out' || item.stock === 0 ? (
              <span className="text-[10px] font-black text-white bg-rose-700 px-2 py-0.5 rounded border border-rose-800 uppercase tracking-wider ">
                ELFOGYOTT
              </span>
            ) : item.status === 'cooking' ? (
              <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                FŐZÉS ALATT
              </span>
            ) : null}

            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
              {item.available_day === 'saturday' ? 'Szombat' : item.available_day === 'sunday' ? 'Vasárnap' : 'Mindkét nap'}
            </span>
            {item.is_gluten_free && (
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                GM
              </span>
            )}
            {item.is_lactose_free && (
              <span className="text-[10px] font-extrabold text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-200">
                LM
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-extrabold text-sm sm:text-base leading-snug transition-colors ${
              item.status === 'sold_out' || item.stock === 0 ? 'text-stone-400 line-through' : 'text-stone-900 group-hover:text-amber-800'
            }`}>
              {item.name}
            </h3>
          </div>
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
              <span key={t} className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-semibold">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Művelet-sor: egy sorban, nem tördel.
            A két ikonos gomb felirat nélkül négyzet -- a "Hol találom?" és a
            "Kedvenchez" szöveg nem mondott többet, mint az ikon, viszont
            elvitte a helyet, és a szavazás gomb emiatt a következő sorba
            csúszott. A szavazatszám marad kiírva: az tényleges információ,
            nem dísz. */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5">
          {/* Hol találom? */}
          <button
            onClick={() => setSelectedLocationModalData({ item, exhibitor })}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded bg-stone-100 hover:bg-amber-100 text-stone-700 border border-stone-200 shadow-2xs transition-all cursor-pointer"
            title="Hol találom? – stand helye a térképen"
            aria-label="Hol találom? A stand helye a térképen"
          >
            <MapPin className="w-4 h-4 text-amber-700" />
          </button>

          {/* Kedvenc */}
          <button
            onClick={() => toggleFavoriteItem(item.id)}
            className={`h-9 w-9 shrink-0 flex items-center justify-center rounded border shadow-2xs transition-all cursor-pointer ${
              isFavItem
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-stone-50 hover:bg-rose-50 text-stone-600 border-stone-200'
            }`}
            title={isFavItem ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
            aria-label={isFavItem ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
            aria-pressed={isFavItem}
          >
            <Heart className={`w-4 h-4 ${isFavItem ? 'fill-rose-700 text-rose-700' : 'text-stone-400'}`} />
          </button>

          {/* Szavazás -- a maradék helyet kapja */}
          <button
            onClick={() => voteForItem(item.id)}
            className={`h-9 flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded text-xs font-extrabold border shadow-2xs transition-all cursor-pointer ${
              isVoted
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300/80'
            }`}
            title="Szavazok erre az ételre"
            aria-pressed={isVoted}
          >
            <ThumbsUp className={`w-4 h-4 shrink-0 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
            <span className="truncate">{isVoted ? `Szavazva (${item.votes || 1})` : `Szavazok (${item.votes || 0})`}</span>
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
              <span>Civil Ízek Utcája • Ételek és italok ({sortedItems.length} találat)</span>
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

        {/* Szűrők.
            Kereső MÁR NINCS itt: a fejlécben van egy, ugyanerre a
            searchQuery állapotra kötve, azonnali találati listával. Két
            egymás alatti kereső ugyanarra a célra csak zavar.

            A SZŰRŐ LOGIKA viszont marad (matchesSearch, feljebb) -- azt
            hajtja a fejléc keresője. Egy korábbi próbálkozás a logikát is
            kivette a mezővel együtt, amitől a fejlécből nem szűrt semmi. */}
      <div className="bg-white border border-stone-200/90 rounded-md p-3 sm:p-4 shadow-2xs space-y-3">

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => { setActiveCategory('all'); if (setSelectedCategory) setSelectedCategory('all'); }} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all ${activeCategory === 'all' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-amber-300'}`}>Minden</button>
          {categoryFilters.map((section) => {
            const IconComp = section.icon;
            return <button key={section.id} onClick={() => { setActiveCategory(section.id); if (setSelectedCategory) setSelectedCategory(section.id); }} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all flex items-center gap-1.5 ${activeCategory === section.id ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-amber-300'}`}>
              <IconComp className="w-3.5 h-3.5" />{section.title.replace(' / Édesség', '')}
            </button>;
          })}
        </div>

        {availableTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setActiveTag('all')} className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${activeTag === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}>Összes jelleg</button>
            {visibleTags.map(([tag]) => (
              <button key={tag} onClick={() => setActiveTag(tag)} className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${activeTag === tag ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}>{tag}</button>
            ))}
          </div>
        )}
        {availableTags.length > 8 && (
          <button onClick={() => setShowAllTags((v) => !v)} className="text-[11px] font-bold text-stone-500 hover:text-stone-900">
            {showAllTags ? 'Kevesebb szűrő' : `További szűrők (${availableTags.length - 8})`}
          </button>
        )}

        {(activeCategory !== 'all' || activeTag !== 'all' || searchQuery) && (
          <button onClick={() => { setActiveCategory('all'); setActiveTag('all'); if (setSearchQuery) setSearchQuery(''); }} className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1">
            <X className="w-3 h-3" /> Szűrők törlése
          </button>
        )}
      </div>

      {/* Dishes Content */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      ) : sortedItems.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-md p-8 text-center text-stone-400 space-y-2">
          <Info className="w-8 h-8 mx-auto opacity-40 text-amber-800" />
          <p className="text-sm font-bold text-stone-700">Nincs a szűrésnek megfelelő étel vagy ital.</p>
          <button
            onClick={() => {
              if (setSelectedCategory) setSelectedCategory('all');
              setActiveCategory('all');
              setActiveTag('all');
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
          {/* Category sections */}
          {CATEGORY_SECTIONS.map((section) => {
            const isDrinkSection = section.id === 'italok';
            const sectionItems = sortedItems.filter((i) => {
              if (isDrinkSection) return i.category === 'italok' || i.category === 'ital';
              return i.category === section.id;
            });

            if (sectionItems.length === 0) return null;

            const IconComp = section.icon;
            // Keresés közben nyitva, hacsak kézzel be nem csukták; egyébként
            // csukva, amíg ki nem nyitják.
            const searchActive = Boolean(searchQuery && searchQuery.trim());
            const isOpen = searchActive
              ? openSections[section.id] !== false
              : openSections[section.id] === true;
            const isClosed = !isOpen;

            return (
              <div key={section.id} className="bg-white border border-stone-200 rounded-md overflow-hidden shadow-2xs">
                {/* Ultra-thin Header Bar (Szöveg ---------------- Lenyitás gomb) */}
                <button
                  onClick={() => toggleSection(section.id, isOpen)}
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
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ">
                    {sectionItems.map((item) => renderDishCard(item))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized fallback items section */}
          {(() => {
            const definedCatIds = ['meleg_etel', 'hideg_etel', 'sutemeny', 'street_food', 'italok', 'ital', 'egyeb'];
            const uncategorized = sortedItems.filter((i) => !definedCatIds.includes(i.category));
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

      {/* Dish Location Modal */}
      {selectedLocationModalData && (
        <DishLocationModal
          item={selectedLocationModalData.item}
          exhibitor={selectedLocationModalData.exhibitor}
          onClose={() => setSelectedLocationModalData(null)}
        />
      )}
    </div>
  );
}
