import React, { useState, useEffect, useRef } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, ArrowRight, Compass, Waves, Trees, Castle, Heart, Navigation, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Helper function to shorten exhibitor names for clean map pills
const getShortExhibitorName = (exhibitor) => {
  if (!exhibitor || !exhibitor.name) return '';
  if (exhibitor.short_name) return exhibitor.short_name;

  const name = exhibitor.name.trim();
  const lower = name.toLowerCase();

  if (lower.includes('fitt-box') || lower.includes('fitt box')) return 'Fitt-Box';
  if (lower.includes('turisztikai')) return 'KTSZE';
  if (lower.includes('kovács miklós')) return 'Csendes Kovács';
  if (lower.includes('sütiarcok') || lower.includes('sutiarcok')) return 'Sütiarcok';

  if (name.length > 14) {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
  }
  return name;
};

export default function MapView() {
  const { exhibitors, menuItems, favoriteExhibitorIds, navigateToStand, showToast, focusedExhibitorIdOnMap } = useOrsolya();
  const [selectedExhibitorId, setSelectedExhibitorId] = useState(focusedExhibitorIdOnMap || exhibitors[0]?.id || null);
  const [mapMode, setMapMode] = useState('gps'); // 'gps' | 'schematic'
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

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

  const selectedExhibitor = exhibitors.find((ex) => ex.id === selectedExhibitorId);
  const selectedItems = menuItems.filter((i) => i.exhibitor_id === selectedExhibitorId);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapMode !== 'gps' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [47.38936, 16.53894],
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

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

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

      const shortName = getShortExhibitorName(ex);

      const customHtml = `
        <div class="relative group cursor-pointer">
          <div class="px-1.5 py-0.5 rounded-xs ${pinBg} text-[10px] flex items-center justify-center border border-white whitespace-nowrap tracking-tight">
            <span>${shortName}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'custom-leaflet-pin',
        iconSize: [90, 24],
        iconAnchor: [45, 12]
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
  }, [mapMode, exhibitors, selectedExhibitorId, favoriteExhibitorIds, userLocation]);

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
                  {ex.name} ({getShortExhibitorName(ex)})
                </option>
              ))}
            </select>
          </div>

          {/* User Location Button */}
          {mapMode === 'gps' && (
            <button
              onClick={handleGetLocation}
              disabled={isLocating}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5 text-white" />
              <span>{isLocating ? 'Helymeghatározás...' : 'Hol vagyok? (GPS)'}</span>
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMapMode('gps')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                mapMode === 'gps'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>GPS Műholdas Térkép</span>
            </button>

            <button
              onClick={() => setMapMode('schematic')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                mapMode === 'schematic'
                  ? 'bg-white text-stone-900 border border-stone-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>Sematikus Sétány</span>
            </button>
          </div>

          {userLocation && (
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
              Saját pozíció aktív
            </span>
          )}
        </div>

        {/* GPS Leaflet View */}
        {mapMode === 'gps' ? (
          <div className="relative rounded-md overflow-hidden border border-stone-200 shadow-inner min-h-[380px] sm:min-h-[440px] z-10">
            <div ref={mapContainerRef} className="w-full h-[380px] sm:h-[440px] bg-stone-100" />
            
            {/* Corner Legend Badge */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-md border border-stone-200 shadow-md text-[11px] space-y-1">
              <span className="font-extrabold text-stone-900 block flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700 inline-block border border-amber-900"></span>
                Diáksétány Fesztiválterület
              </span>
              <span className="text-[10px] text-stone-500 block">47.3889N - 47.3900N • 16.5379E - 16.5399E</span>
            </div>
          </div>
        ) : (
          /* Schematic Path View */
          <div className="relative bg-stone-50 border border-stone-200/90 rounded-md p-6 min-h-[300px] flex flex-col justify-between overflow-hidden">
            {/* Stream */}
            <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-sky-100/90 border-y border-sky-300/70 flex items-center justify-around text-sky-800 text-[11px] font-bold tracking-widest pointer-events-none select-none">
              <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-sky-700" /> Gyöngyös-patak</span>
              <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-sky-700" /> Gyöngyös-patak</span>
              <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-sky-700" /> Gyöngyös-patak</span>
            </div>

            {/* Landmarks */}
            <div className="flex justify-between items-center relative z-10 text-xs font-bold text-stone-700">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-stone-200 shadow-xs">
                <Castle className="w-4 h-4 text-amber-700" />
                <span>Jurisics Vár</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-stone-200 shadow-xs">
                <Trees className="w-4 h-4 text-emerald-700" />
                <span>Várpark & Színpad</span>
              </div>
            </div>

            {/* Stand Pills */}
            <div className="relative z-10 my-6 flex items-center justify-between gap-2 overflow-x-auto py-3 px-1 scrollbar-none">
              {exhibitors.map((ex) => {
                const isSelected = ex.id === selectedExhibitorId;
                const isFavorite = favoriteExhibitorIds.includes(ex.id);

                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExhibitorChange(ex.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-800 text-white border-amber-800 shadow-md scale-105 font-black'
                        : 'bg-white text-stone-900 border-stone-200 hover:border-amber-600 font-bold'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-amber-700'}`} />
                    <span className="text-xs">{ex.name}</span>
                    {isFavorite && <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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


