import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import VisitKoszegLogo from './VisitKoszegLogo';
import { Printer, Download, QrCode, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ExhibitorQRCard({ exhibitor }) {
  const printRef = useRef(null);

  if (!exhibitor) return null;

  // The QR code contains the full URL with query param ?stand=exhibitor_id
  const currentOrigin = window.location.origin + window.location.pathname;
  const qrUrl = `${currentOrigin}?stand=${exhibitor.id}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = () => {
    const svg = document.getElementById(`exhibitor-qr-svg-${exhibitor.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 100, 100, 800, 800);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${exhibitor.name.replace(/\s+/g, '_')}_QR_Kod.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6">
      {/* Top Action Buttons (Hidden on Print) */}
      <div className="no-print bg-stone-50 border border-stone-200/80 p-4 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-700" />
            <span>Nyomtatható Stand QR Kártya</span>
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Helyezd ki a pultra, hogy a látogatók egyből beszkennelhessék a standodat!
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadPNG}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-stone-700" />
            <span>PNG Letöltése</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded-md shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Nyomtatás / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Card Area */}
      <div
        ref={printRef}
        className="print-area bg-white border-2 border-stone-900 rounded-md p-6 sm:p-10 shadow-xl max-w-md mx-auto text-center space-y-6 relative overflow-hidden"
      >
        {/* Decorative Top Accent Bar */}
        <div className="bg-amber-800 h-3 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-4" />

        {/* VisitKőszeg Branding Header */}
        <div className="flex justify-center items-center pb-2 border-b border-stone-200">
          <VisitKoszegLogo size="md" />
        </div>

        {/* Festival Badge */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-800" />
            <span>CIVIL ÍZEK UTCÁJA • DIÁKSÉTÁNY</span>
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-3 leading-tight">
            {exhibitor.name}
          </h2>

          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-1">
            📍 {exhibitor.location}
          </p>
        </div>

        {/* Center QR Code Display */}
        <div className="bg-stone-50 border-2 border-stone-200 p-6 rounded-md inline-block shadow-inner relative">
          <QRCodeSVG
            id={`exhibitor-qr-svg-${exhibitor.id}`}
            value={qrUrl}
            size={220}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#1c1917"
          />

          <div className="mt-3 text-[11px] font-mono text-stone-500 bg-white px-2 py-1 rounded-lg border border-stone-200">
            ID: {exhibitor.id}
          </div>
        </div>

        {/* Visitor Instructions */}
        <div className="space-y-1.5 bg-amber-50 border border-amber-200/80 p-4 rounded-md">
          <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>SZKENNELD BE A TELEFONODDAL!</span>
          </h4>
          <p className="text-xs text-stone-700 leading-relaxed font-medium">
            Mentsd el a standot a <strong>Kedvenceid</strong> közé és kövesd élőben a rotyogó adagszámokat!
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-stone-200 text-[10px] text-stone-400 font-medium">
          Orsolya-Napi Vásár • VISITKOSZEG.hu • Real-time Stand QR
        </div>
      </div>
    </div>
  );
}
