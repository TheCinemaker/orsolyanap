import React from 'react';

/**
 * VisitKőszeg Clean Apple Light-Mode Logo
 */
export function VisitKoszegIcon({ className = "w-7 h-8", color = "#d97706" }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M 50 112 L 14 62 V 34 L 32 14 V 4 H 36 V 14 H 64 V 4 H 68 V 14 L 74 20 V 8 H 78 V 24 L 86 34 V 62 Z"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 28 66 L 50 92 L 72 66"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VisitKoszegLogo({ className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <VisitKoszegIcon className="w-6 h-7" color="#b45309" />
      <div className="flex items-baseline font-semibold tracking-tight text-xl">
        <span className="font-medium text-stone-900">visit</span>
        <span className="font-bold text-amber-700">koszeg</span>
      </div>
    </div>
  );
}
