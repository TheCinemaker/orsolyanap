import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, QrCode, Camera, CheckCircle2, Sparkles, MapPin } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose }) {
  const { exhibitors, addFavoriteExhibitor } = useOrsolya();
  const [scannedStand, setScannedStand] = useState(null);
  const [manualStandId, setManualStandId] = useState('');

  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setScannedStand(null);
      return;
    }

    // Initialize HTML5 QR Code Scanner inside #qr-reader element
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 220, height: 220 }
    });

    scanner.render(
      (decodedText) => {
        // Handle decoded QR code text
        // E.g., 'ex-1' or 'https://.../?stand=ex-1'
        let standId = decodedText;
        if (decodedText.includes('stand=')) {
          standId = decodedText.split('stand=')[1].split('&')[0];
        }

        const found = exhibitors.find((ex) => ex.id === standId || ex.pin === standId);
        if (found) {
          addFavoriteExhibitor(found.id);
          setScannedStand(found);
          scanner.clear();
        }
      },
      (error) => {
        // Ignore scan frame errors
      }
    );

    return () => {
      try {
        scanner.clear();
      } catch (e) {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualStandId) return;

    const found = exhibitors.find((ex) => ex.id === manualStandId || ex.location.includes(manualStandId));
    if (found) {
      addFavoriteExhibitor(found.id);
      setScannedStand(found);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-md p-6 w-full max-w-md shadow-2xl relative space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {!scannedStand ? (
          <>
            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                QR KÓD OLVASÓ
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 mt-2">
                Szkenneld be a Stand QR kódját!
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                Tartsd a kamerát a standnál kihelyezett QR kód elé a kedvencekhez adáshoz.
              </p>
            </div>

            {/* Camera Viewport */}
            <div className="bg-stone-50 border border-stone-200 rounded-md p-2 overflow-hidden min-h-[260px]">
              <div id="qr-reader" className="w-full text-xs" />
            </div>

            {/* Quick Demo Stand Selectors for testing */}
            <div className="pt-2 border-t border-stone-100 text-center">
              <span className="text-[11px] font-bold text-stone-400 block mb-2">
                Vagy válassz demó standot teszteléshez:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {exhibitors.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      addFavoriteExhibitor(ex.id);
                      setScannedStand(ex);
                    }}
                    className="text-[11px] font-semibold bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors"
                  >
                    + {ex.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Scanned Success View */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                SIKERES SZKENNELÉS
              </span>
              <h2 className="text-xl font-bold text-stone-900 mt-2">{scannedStand.name}</h2>
              <p className="text-xs text-stone-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700 inline" /> {scannedStand.location}
              </p>
            </div>

            <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-md border border-stone-200">
              A stand elmentve a <strong>Kedvenceid</strong> közé a telefonodon! Bármikor megtalálod a térképen.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setScannedStand(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-md"
              >
                Új QR Kód
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-md"
              >
                Kész
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
