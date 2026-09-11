import React, { useEffect, useRef } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, X, ArrowRight, Store } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function DishLocationModal({ item, exhibitor, onClose }) {
  const { focusExhibitorOnMap, setActiveView } = useOrsolya();
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  useEffect(() => {
    if (!exhibitor || !mapContainerRef.current) return;

    // Use exhibitor coordinates or fallback to Diáksétány default
    const coords = exhibitor.coordinates && Array.isArray(exhibitor.coordinates)
      ? exhibitor.coordinates
      : [47.38936, 16.53894];

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: coords,
        zoom: 20,
        maxZoom: 22,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
        maxNativeZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      leafletMapRef.current = map;

      const pinHtml = `
        <div class="px-2 py-1 rounded-xs bg-amber-900 text-amber-50 text-[11px] font-black border border-white shadow-lg whitespace-nowrap">
          <span>${exhibitor.name}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: pinHtml,
        className: 'modal-leaflet-pin',
        iconSize: [120, 28],
        iconAnchor: [60, 14]
      });

      L.marker(coords, { icon }).addTo(map);

      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 250);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [exhibitor]);

  const handleOpenFullMap = () => {
    onClose();
    if (exhibitor && exhibitor.id) {
      focusExhibitorOnMap(exhibitor.id);
    } else {
      setActiveView('map');
    }
  };

  if (!item || !exhibitor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-md w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-200">
              STAND ÉS GPS POZÍCIÓ
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-amber-200 hover:text-white hover:bg-amber-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto">
          {/* Dish & Stand Brief */}
          <div className="bg-stone-50 border border-stone-200 rounded-md p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 leading-snug">
                  {item.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold mt-0.5">
                  <Store className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  <span>{exhibitor.name}</span>
                </div>
              </div>
              {item.price && (
                <span className="bg-amber-100 text-amber-950 font-black text-xs px-2.5 py-1 rounded-md border border-amber-300 whitespace-nowrap">
                  {item.price} Ft
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 font-medium flex items-center gap-1 pt-1 border-t border-stone-200/60">
              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Helyszín: {exhibitor.location || 'Diáksétány'}</span>
            </p>
          </div>

          {/* Mini Leaflet Map */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">
              Stand elhelyezkedése a Diáksétányon:
            </label>
            <div className="relative rounded-md overflow-hidden border border-stone-200 shadow-inner h-[220px] sm:h-[260px]">
              <div ref={mapContainerRef} className="w-full h-full bg-stone-100" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            Bezárás
          </button>

          <button
            onClick={handleOpenFullMap}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Megnyitás nagy térképen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
