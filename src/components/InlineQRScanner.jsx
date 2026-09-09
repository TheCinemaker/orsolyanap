import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useOrsolya } from '../context/OrsolyaContext';
import { Camera, CheckCircle2, QrCode, Sparkles, MapPin, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function InlineQRScanner() {
  const { exhibitors, addFavoriteExhibitor, showToast } = useOrsolya();
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [lastScannedStand, setLastScannedStand] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isCameraActive) return;

    let scanner = null;
    try {
      scanner = new Html5QrcodeScanner('inline-qr-reader', {
        fps: 10,
        qrbox: { width: 200, height: 200 },
        aspectRatio: 1.0
      });

      scanner.render(
        (decodedText) => {
          let standId = decodedText;
          if (decodedText.includes('stand=')) {
            const urlParams = new URLSearchParams(decodedText.split('?')[1]);
            standId = urlParams.get('stand');
          }

          const found = exhibitors.find((ex) => ex.id === standId || ex.pin === standId);
          if (found) {
            addFavoriteExhibitor(found.id);
            setLastScannedStand(found);
            showToast(`${found.name} beszkennelve és elmentve a Kedvencekhez!`, 'success');
          }
        },
        (error) => {
          // ignore scan frame errors
        }
      );
      scannerRef.current = scanner;
    } catch (e) {
      console.warn('QR scanner init:', e);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [isCameraActive, exhibitors]);

  const handleDemoScan = (exhibitor) => {
    addFavoriteExhibitor(exhibitor.id);
    setLastScannedStand(exhibitor);
    showToast(`${exhibitor.name} beszkennelve és elmentve!`, 'success');
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-md p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-md border border-amber-300/60">
            <Camera className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
              <span>Beágyazott Élő QR Kód Olvasó</span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                ÉLŐ KAMERA
              </span>
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Tartsd a telefonod a stand pultjára kitett QR kódra a mentéshez!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCameraActive((prev) => !prev)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 border ${
            isCameraActive
              ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              : 'bg-amber-800 text-white border-amber-800 shadow-xs'
          }`}
        >
          {isCameraActive ? (
            <>
              <span>Kamera Szüneteltetése</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Kamera Indítása</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Main Scanner Body */}
      {isCameraActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-stone-50 p-4 rounded-md border border-stone-200/80">
          {/* Live Camera Feed Container */}
          <div className="relative rounded-md overflow-hidden border-2 border-amber-600/40 bg-black min-h-[220px] flex items-center justify-center">
            <div id="inline-qr-reader" className="w-full text-white font-mono text-xs" />
          </div>

          {/* Right Status / Feedback Panel */}
          <div className="space-y-3">
            {lastScannedStand ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md text-center space-y-2 animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase">
                  SIKERES SZKENNELÉS
                </span>
                <h4 className="font-extrabold text-stone-900 text-base">{lastScannedStand.name}</h4>
                <p className="text-xs text-amber-800 font-bold flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" /> {lastScannedStand.location}
                </p>
                <p className="text-[11px] text-stone-600 font-medium pt-1">
                  A stand bekerült a <strong>Kedvenceid</strong> közé és kiemelést kapott a térképen!
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 inline-block">
                  ÚTMUTATÓ
                </span>
                <h4 className="text-sm font-bold text-stone-900">
                  Irányítsd a kamerát a pultra kihelyezett táblára!
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  A rendszer automatikusan felismeri a kerek vagy szögletes QR kódot. Nem kell kattintgatnod.
                </p>
              </div>
            )}

            {/* Quick Demo Simulator Buttons (Works on Desktop) */}
            <div className="pt-2 border-t border-stone-200/60 space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Gyors Demó Tesztelés (Kamera nélkül):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {exhibitors.slice(0, 3).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleDemoScan(ex)}
                    className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-[11px] font-bold text-stone-800 shadow-2xs transition-all"
                  >
                    + Szkennelés: {ex.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
