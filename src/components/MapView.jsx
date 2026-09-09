import React, { useState, useEffect, useRef } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { FESTIVAL_BOUNDS } from '../data/mockOrsolyaData';
import { MapPin, ArrowRight, Compass, Waves, Trees, Castle, Heart, Navigation, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView() {
  const { exhibitors, menuItems, favoriteExhibitorIds, setActiveView, addToCart, showToast } = useOrsolya();
  const [selectedExhibitorId, setSelectedExhibitorId] = useState(exhibitors[0]?.id || null);
  const [mapMode, setMapMode] = useState('gps'); // 'gps' | 'schematic'
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const userMarkerRef = useRef(null);

  const selectedExhibitor = exhibitors.find((ex) => ex.id === selectedExhibitorId);
  const selectedItems = menuItems.filter((i) => i.exhibitor_id === selectedExhibitorId);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapMode !== 'gps' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Center of festival polygon
      const map = L.map(mapContainerRef.current, {
        center: [47.38952, 16.53894],
        zoom: 18,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // CartoDB Light Tile Layer (Apple Design Compatible Light Mode)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      // Draw Festival 4-Corner Polygon
      const polygon = L.polygon(FESTIVAL_BOUNDS, {
        color: '#b45309',
        weight: 3,
        fillColor: '#d97706',
        fillOpacity: 0.18,
        dashArray: '5, 8'
      }).addTo(map);

      // Fit map bounds smoothly
      map.fitBounds(polygon.getBounds(), { padding: [30, 30] });

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add Exhibitor Markers
    exhibitors.forEach((ex) => {
      if (!ex.coordinates) return;

      const isSelected = ex.id === selectedExhibitorId;
      const isFav = favoriteExhibitorIds.includes(ex.id);
      const items = menuItems.filter((i) => i.exhibitor_id === ex.id);
      const totalStock = items.reduce((s, i) => s + i.stock, 0);

      const pinColor = isSelected ? '#78350f' : isFav ? '#be123c' : '#b45309';

      const customHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
          <div style="background-color: ${pinColor};" class="px-2.5 py-1 rounded-full text-white font-extrabold text-[11px] shadow-lg flex items-center gap-1 border-2 border-white">
            <span>${ex.name.split(' ')[0]}</span>
            <span class="bg-white/20 px-1.5 rounded-full text-[10px]">${totalStock}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'custom-leaflet-pin',
        iconSize: [120, 36],
        iconAnchor: [60, 18]
      });

      const marker = L.marker(ex.coordinates, { icon }).addTo(map);

      marker.on('click', () => {
        setSelectedExhibitorId(ex.id);
        map.panTo(ex.coordinates);
      });
    });

    // Add user marker if available
    if (userLocation) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-sky-400 opacity-75"></span>
          <div class="w-4 h-4 bg-sky-600 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-location-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon }).addTo(map);
    }
  }, [mapMode, exhibitors, selectedExhibitorId, favoriteExhibitorIds, menuItems, userLocation]);

  // Handle Geolocation tracking
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
          leafletMapRef.current.flyTo(coords, 19);
        }
        showToast('Pozíció azonosítva a Diáksétányon!', 'success');
      },
      (err) => {
        setIsLocating(false);
        showToast('Nem sikerült lekérni a GPS pozíciót.', 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60 inline-flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-amber-700" />
          <span>CIVIL ÍZEK UTCÁJA • GPS TÉRKÉP</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Civil Ízek Utcája Interaktív Térkép
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium">
          A Natúrpark Ízei Gasztronómiai Fesztivál diáksétányi szakaszának GPS lehatárolása a Gyöngyös-patak mentén.
        </p>
      </div>

      {/* Map Control Bar */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-100 pb-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 w-full sm:w-auto">
            <button
              onClick={() => setMapMode('gps')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mapMode === 'gps'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              <span>GPS Műholdas Térkép</span>
            </button>

            <button
              onClick={() => setMapMode('schematic')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mapMode === 'schematic'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>Sematikus Sétány</span>
            </button>
          </div>

          {/* User Geolocation Button */}
          {mapMode === 'gps' && (
            <button
              onClick={handleGetLocation}
              disabled={isLocating}
              className="w-full sm:w-auto px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Helymeghatározás...' : 'Hol vagyok a fesztiválon?'}</span>
            </button>
          )}
        </div>

        {/* GPS Leaflet View */}
        {mapMode === 'gps' ? (
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-inner min-h-[380px] sm:min-h-[440px] z-10">
            <div ref={mapContainerRef} className="w-full h-[380px] sm:h-[440px] bg-stone-100" />
            
            {/* Corner Legend Badge */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-stone-200 shadow-md text-[11px] space-y-1">
              <span className="font-extrabold text-stone-900 block flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700 inline-block border border-amber-900"></span>
                Diáksétány Fesztiválterület
              </span>
              <span className="text-[10px] text-stone-500 block">47.3889N - 47.3900N • 16.5379E - 16.5399E</span>
            </div>
          </div>
        ) : (
          /* Schematic Path View */
          <div className="relative bg-stone-50 border border-stone-200/90 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between overflow-hidden">
            {/* Stream */}
            <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-sky-100/90 border-y border-sky-300/70 flex items-center justify-around text-sky-800 text-[11px] font-bold tracking-widest pointer-events-none select-none">
              <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-sky-700" /> Gyöngyös-patak</span>
              <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-sky-700" /> Gyöngyös-patak</span>
              <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-sky-700" /> Gyöngyös-patak</span>
            </div>

            {/* Landmarks */}
            <div className="flex justify-between items-center relative z-10 text-xs font-bold text-stone-700">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
                <Castle className="w-4 h-4 text-amber-700" />
                <span>Jurisics Vár</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
                <Trees className="w-4 h-4 text-emerald-700" />
                <span>Várpark & Színpad</span>
              </div>
            </div>

            {/* Stand Pills */}
            <div className="relative z-10 my-6 flex items-center justify-between gap-2 overflow-x-auto py-3 px-1 scrollbar-none">
              {exhibitors.map((ex) => {
                const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);
                const totalStock = exItems.reduce((s, i) => s + i.stock, 0);
                const isSelected = ex.id === selectedExhibitorId;
                const isFavorite = favoriteExhibitorIds.includes(ex.id);

                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExhibitorId(ex.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-amber-800 text-white border-amber-800 shadow-md scale-105'
                        : 'bg-white text-stone-900 border-stone-200 hover:border-amber-600'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-amber-700'}`} />
                      <span>{ex.name}</span>
                      {isFavorite && <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-amber-700 text-amber-100' : 'bg-stone-100 text-stone-600'}`}>
                      {totalStock} adag kapható
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Exhibitor Preview Box */}
        {selectedExhibitor && (
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
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
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 mt-1">
                  {selectedExhibitor.name}
                </h3>
                {selectedExhibitor.story && (
                  <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                    {selectedExhibitor.story}
                  </p>
                )}
              </div>

              <button
                onClick={() => setActiveView('visitor')}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs self-start sm:self-center flex items-center gap-1 whitespace-nowrap"
              >
                <span>Ételek listázása</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dishes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Stand kínálata:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 p-3 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">{item.name}</span>
                      <span className="text-[10px] text-amber-800 font-semibold">Adományos kóstolás</span>
                    </div>
                    <button
                      onClick={() => addToCart(item, selectedExhibitor)}
                      disabled={item.stock <= 0}
                      className="px-2.5 py-1 bg-amber-800 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700 transition-all disabled:opacity-40"
                    >
                      + Kóstoló ({item.stock} adag)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
