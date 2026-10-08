import React from 'react';
import { X, Heart, ShieldCheck } from 'lucide-react';
import DonationForm from './DonationForm';

export default function DonationModal({
  isOpen,
  onClose,
  initialAmount = 2000,
  title = 'KTSZE Adománygyűjtés — SimplePay & Qvik',
  description = 'A bankkártyás fizetés és adományozás a Kőszegi Turisztikai Szövetség (KTSZE) számlájára érkezik.',
  onSuccess,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative my-auto space-y-4">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-all border border-stone-200"
          title="Bezárás"
        >
          <X className="w-5 h-5" />
        </button>

        {/* KTSZE Header Badge */}
        <div className="flex items-center gap-2 pr-8">
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-1 rounded-md flex items-center gap-1">
            <Heart className="w-3 h-3 text-amber-800 fill-amber-700" />
            <span>KTSZE EGYESÜLET</span>
          </span>
          <span className="text-[10px] font-semibold text-stone-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>SimplePay v2 & Qvik</span>
          </span>
        </div>

        <DonationForm
          title={title}
          description={description}
          initialAmount={initialAmount}
          onSuccess={(result) => {
            if (onSuccess) onSuccess(result);
            setTimeout(() => onClose(), 1500);
          }}
        />
      </div>
    </div>
  );
}
