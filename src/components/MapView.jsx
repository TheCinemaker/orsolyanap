import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, ArrowRight, Heart, Navigation, Car } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  POINTS_OF_INTEREST,
  POI_KINDS,
  FESTIVAL_CENTRE,
  poisOfKind,
  metresFromCentre,
  humanDistance,
  directionsUrl,
} from '../data/helyszinek';

// Helper function to shorten exhibitor names for clean map pills
/**
 * A kézműves kirakodóvásár területe a történelmi belvárosban.
 *
 * A sarokpontokat a szervező adta meg, ebben a bejárási sorrendben. A
 * 2. és 6. pont 8 méterre van egymástól: ott szűkül össze a terület, ahol
 * a Fő tér és a Jurisics tér egy keskeny utcán kapcsolódik. Nem hiba.
 *
 * Itt SZÁNDÉKOSAN nincsenek standok: a területen 150 vásáros árul, őket az
 * app nem tartja nyilván - csak azt mutatjuk meg, hol keresd őket.
 */
const CRAFT_MARKET_AREA = [
  [47.39003359665649, 16.539088249995245],
  [47.389771564347036, 16.539819621629366],
  [47.38862645881784, 16.541010216127287],
  [47.38874895819742, 16.541316197101576],
  [47.39023591742202, 16.54076463595943],
  [47.389844333743405, 16.539820866892534],
  [47.39007537893043, 16.539174983991717],
];

/** A parkolo-nezethez: a fesztival ES a parkolok egyszerre latszodjanak. */
const PARKING_LOTS = poisOfKind('parkolo');

/**
 * Stand-sorszámok.
 *
 * Harmincnyolc sátor áll egymás mellett 3 méterre: a nevek — még rövidítve is
 * — egymásra csúsztak a térképen. Egy szám elfér egy apropó pinben, a nevet
 * pedig a térkép alatti jegyzékben olvassa a látogató.
 *
 * A számozás NÉV SZERINTI és nem a sétány mentén futó: a gyakoribb kérdés az,
 * hogy egy ismert csapat hol van, nem az, hogy ez itt melyik sátor — arra ott a
 * koppintás. Név szerint a jegyzék átfutható, és ugyanez a számozás mehet a
 * helyszíni táblára is.
 */
const numberExhibitors = (exhibitors) => {
  const sorted = [...exhibitors].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hu'));
  return new Map(sorted.map((x, i) => [x.id, i + 1]));
};

export default function MapView() {
  const { exhibitors, menuItems, favoriteExhibitorIds, navigateToStand, showToast, focusedExhibitorIdOnMap } = useOrsolya();
  const [selectedExhibitorId, setSelectedExhibitorId] = useState(focusedExhibitorIdOnMap || exhibitors[0]?.id || null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  // A helyszin-pinek alapbol LATSZANAK: a vendegnek a mosdo es a szinpad
  // ugyanolyan fontos, mint a stand. Aki zsufoltnak talalja, egy koppintassal
  // elrejti.
  const [showPois, setShowPois] = useState(true);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Auto-locate user immediately when MapView is opened (request phone permission)
  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setIsLocating(false);
          if (leafletMapRef.current) {
            leafletMapRef.current.flyTo(coords, 20);
          }
          showToast('GPS pozíció azonosítva! Látható hol állsz a Diáksétányon.', 'success');
        },
        (err) => {
          setIsLocating(false);
          console.warn('Geolocation notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // If focusedExhibitorIdOnMap changes, focus it
  useEffect(() => {
    if (focusedExhibitorIdOnMap) {
      setSelectedExhibitorId(focusedExhibitorIdOnMap);
      const found = exhibitors.find((e) => e.id === focusedExhibitorIdOnMap);
      if (found && found.coordinates && leafletMapRef.current) {
        leafletMapRef.current.flyTo(found.coordinates, 20);
      }
    }
  }, [focusedExhibitorIdOnMap, exhibitors]);

  const numbers = useMemo(() => numberExhibitors(exhibitors), [exhibitors]);

  const selectedExhibitor = exhibitors.find((ex) => ex.id === selectedExhibitorId);
  const selectedItems = menuItems.filter((i) => i.exhibitor_id === selectedExhibitorId);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: FESTIVAL_CENTRE,
        zoom: 19,
        maxZoom: 22,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // OpenStreetMap Standard Free Tiles (100% Free, NO API KEY Required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
        maxNativeZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // A kézműves vásár területe. Az inicializáló blokkban, mert az csak
      // egyszer fut -- a lenti marker-takarítás csak L.Marker példányokat
      // töröl, így ez a réteg megmarad.
      L.polygon(CRAFT_MARKET_AREA, {
        color: '#92400e',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
      })
        .addTo(map)
        .bindTooltip('Kézműves vásár', {
          permanent: true,
          direction: 'center',
          className: 'craft-market-label',
        });


      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Helyszinek: szinpad, mosdo, parkolo, versenyhelyszin. A stand-markerek
    // ELOTT kerulnek fel, hogy azok maradjanak felul: az app elsosorban a
    // standokrol szol, a helyszin a kontextus hozza.
    if (showPois) {
      POINTS_OF_INTEREST.forEach((poi) => {
        const kind = POI_KINDS[poi.kind];
        const poiHtml = `
          <div class="relative cursor-pointer">
            <div class="px-1.5 py-0.5 rounded-xs ${kind.pill} text-white font-bold border border-white shadow-2xs text-[10px] flex items-center justify-center whitespace-nowrap tracking-tight">
              <span>${poi.label}</span>
            </div>
          </div>
        `;
        const icon = L.divIcon({
          html: poiHtml,
          className: 'custom-leaflet-pin',
          iconSize: [110, 22],
          iconAnchor: [55, 11],
        });

        // A latogatonak nem a helyszin neve a kerdese, hanem hogy mennyit kell
        // odagyalogolnia. Legvonal, de a dontes meghozatalahoz eleg.
        const walk = humanDistance(metresFromCentre(poi.coordinates));

        L.marker(poi.coordinates, { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${poi.title}</strong>` +
              (poi.hint ? `<br>${poi.hint}` : '') +
              `<br>Kb. ${walk} a Diáksétánytól` +
              `<br><a href="${directionsUrl(poi.coordinates)}" target="_blank" rel="noopener noreferrer">Útvonal ide</a>`
          );
      });
    }

    // Add Exhibitor Markers (Compact pills with sharp minimal corners & shortened names)
    exhibitors.forEach((ex) => {
      if (!ex.coordinates) return;

      const isSelected = ex.id === selectedExhibitorId;
      const isFav = favoriteExhibitorIds.includes(ex.id);

      const pinBg = isSelected
        ? 'bg-amber-900 text-amber-50 font-black border-amber-950 shadow-md scale-105 ring-2 ring-amber-400'
        : isFav
        ? 'bg-rose-800 text-white font-extrabold border-rose-900 shadow-2xs hover:bg-rose-700'
        : 'bg-amber-800 text-amber-50 font-bold border-amber-900 shadow-2xs hover:bg-amber-700';

      const num = numbers.get(ex.id) ?? '?';

      const customHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-6 h-6 rounded-full ${pinBg} text-[11px] flex items-center justify-center border-2 border-white leading-none" title="${ex.name.replace(/"/g, '&quot;')}">
            <span>${num}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'custom-leaflet-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(ex.coordinates, { icon }).addTo(map);

      marker.on('click', () => {
        setSelectedExhibitorId(ex.id);
        map.panTo(ex.coordinates);
      });
    });

    // Add user location marker if available (solid blue marker, no flashing)
    if (userLocation) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-4 h-4 bg-sky-600 border-2 border-white rounded-full shadow-lg" title="Te itt állsz!"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-location-pin',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon }).addTo(map);
    }
  }, [exhibitors, selectedExhibitorId, favoriteExhibitorIds, userLocation, showPois, numbers]);

  // Handle Geolocation tracking & re-centering
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('A böngésző nem támogatja a GPS helymeghatározást.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setIsLocating(false);
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo(coords, 20);
        }
        showToast('Pozíció azonosítva a Diáksétányon!', 'success');
      },
      (err) => {
        setIsLocating(false);
        showToast('Nem sikerült lekérni a GPS pozíciót. Ellenőrizd a helymeghatározási engedélyt.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /**
   * A parkolok a varos peremen vannak, a fesztival a belvarosban: 19-es
   * zoomnal a parkolo-pin kepernyon kivul esik. Ez a gomb addig zoomol ki,
   * amig mindket veg latszik, igy a latogato latja a gyalogos tavolsagot is.
   */
  const handleShowParking = () => {
    const map = leafletMapRef.current;
    if (!map || PARKING_LOTS.length === 0) return;
    if (!showPois) setShowPois(true);
    const points = [...PARKING_LOTS.map((lot) => lot.coordinates), FESTIVAL_CENTRE];
    map.fitBounds(L.latLngBounds(points).pad(0.18));
  };

  const handleSelectExhibitorChange = (exhibitorId) => {
    setSelectedExhibitorId(exhibitorId);
    const found = exhibitors.find((ex) => ex.id === exhibitorId);
    if (found && found.coordinates && leafletMapRef.current) {
      leafletMapRef.current.flyTo(found.coordinates, 20);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Map Dropdown & Location Control Bar */}
      <div className="bg-white border border-stone-200/90 rounded-md p-4 sm:p-5 shadow-xs space-y-4">
        {/* Exhibitor Dropdown Menu & GPS Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label htmlFor="exhibitor-select" className="text-xs font-bold text-stone-700 whitespace-nowrap">
              Kiállító keresése:
            </label>
            <select
              id="exhibitor-select"
              value={selectedExhibitorId || ''}
              onChange={(e) => handleSelectExhibitorChange(e.target.value)}
              className="w-full flex-1 bg-stone-50 border border-stone-300 rounded-md px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800 cursor-pointer"
            >
              <option value="" disabled>-- Válassz kiállítót a megtekintéshez --</option>
              {exhibitors.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {numbers.get(ex.id)}. {ex.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Location Button */}
          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Navigation className="w-3.5 h-3.5 text-white" />
            <span>{isLocating ? 'Helymeghatározás...' : 'Hol vagyok? (GPS)'}</span>
          </button>

          {/* Csak akkor van gomb, ha van is mit megmutatni. */}
          {PARKING_LOTS.length > 0 && (
            <button
              onClick={handleShowParking}
              className="px-4 py-2 bg-sky-800 hover:bg-sky-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Car className="w-3.5 h-3.5 text-white" />
              <span>Parkolók</span>
            </button>
          )}

          {/* A pinek elrejtése. Szűk helyen 19 helyszin + 20 stand sűrű lehet,
              de a döntést a látogató hozza meg, nem mi rejtünk el infot. */}
          <button
            onClick={() => setShowPois((v) => !v)}
            aria-pressed={showPois}
            className={`px-4 py-2 font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              showPois
                ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-900'
                : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Helyszínek ({POINTS_OF_INTEREST.length})</span>
          </button>
        </div>

        {/* Leaflet térkép */}
        <div className="relative rounded-md overflow-hidden border border-stone-200 shadow-inner min-h-[380px] sm:min-h-[440px] z-10">
          <div ref={mapContainerRef} className="w-full h-[380px] sm:h-[440px] bg-stone-100" />
          
          {/* Corner Legend Badge */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-md border border-stone-200 shadow-md text-[11px] space-y-1">
            <span className="font-extrabold text-stone-900 block flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700 inline-block border border-amber-900"></span>
              Diáksétány — számozott standok
            </span>
              <span className="font-bold text-amber-900 block flex items-center gap-1 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 inline-block border border-amber-800"></span>
                Kézműves vásár – belváros
              </span>
            {showPois &&
              Object.entries(POI_KINDS).map(([key, kind]) => (
                <span key={key} className="font-bold text-stone-700 block flex items-center gap-1 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-xs inline-block border ${kind.swatch}`}></span>
                  {kind.legend}
                </span>
              ))}
            <span className="text-[10px] text-stone-500 block pt-0.5">
              {showPois ? `${POINTS_OF_INTEREST.length} helyszín megjelölve` : 'Helyszínek elrejtve'}
            </span>
          </div>
        </div>

        {/* Standjegyzék. A térképen csak szám fér el, a név itt van — és innen
            egy koppintással a térkép is rááll. */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-md p-3 sm:p-4">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
            Standjegyzék ({exhibitors.length})
          </h3>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0.5">
            {[...exhibitors]
              .sort((a, b) => (numbers.get(a.id) || 0) - (numbers.get(b.id) || 0))
              .map((ex) => {
                const kivalasztott = ex.id === selectedExhibitorId;
                const kedvenc = favoriteExhibitorIds.includes(ex.id);
                return (
                  <li key={ex.id}>
                    <button
                      onClick={() => handleSelectExhibitorChange(ex.id)}
                      className={`w-full text-left flex items-baseline gap-1.5 py-1 px-1 rounded transition-colors cursor-pointer ${
                        kivalasztott ? 'bg-amber-100' : 'hover:bg-white'
                      }`}
                    >
                      <span
                        className={`shrink-0 w-5 text-right text-[11px] font-black ${
                          kedvenc ? 'text-rose-700' : 'text-amber-800'
                        }`}
                      >
                        {numbers.get(ex.id)}.
                      </span>
                      <span className="text-xs font-bold text-stone-800 leading-snug">{ex.name}</span>
                    </button>
                  </li>
                );
              })}
          </ol>
        </div>

        {/* Selected Exhibitor Preview Box */}
        {selectedExhibitor && (
          <div className="bg-stone-50 border border-stone-200/80 rounded-md p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    KIVÁLASZTOTT STAND
                  </span>
                  {favoriteExhibitorIds.includes(selectedExhibitor.id) && (
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200">
                      <Heart className="w-3 h-3 fill-rose-700" /> Kedvenc
                    </span>
                  )}
                </div>
                <h3
                  onClick={() => navigateToStand(selectedExhibitor)}
                  className="text-lg sm:text-xl font-extrabold text-stone-900 mt-1 cursor-pointer hover:text-amber-800 transition-colors flex items-center gap-1.5 group"
                >
                  <span>{selectedExhibitor.name}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-700 inline" />
                </h3>
                {selectedExhibitor.story && (
                  <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                    {selectedExhibitor.story}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigateToStand(selectedExhibitor)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs self-start sm:self-center flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span>Ugrás a stand oldalára</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dishes Non-Clickable Simple List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Stand kínálata:
              </h4>
              {selectedItems.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedItems.map((item) => (
                    <span
                      key={item.id}
                      className="px-3 py-1 bg-white border border-stone-200 text-stone-800 font-bold text-xs rounded-md shadow-2xs select-none"
                    >
                      • {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">Kínálat hamarosan...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


