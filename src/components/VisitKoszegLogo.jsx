import React from 'react';

/**
 * VisitKőszeg Official Brand Emblem (Jurisics Castle + Mountain Contour Emblem)
 */
export function VisitKoszegIcon({ className = "w-8 h-9", color = "#D6A330" }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M 50 112 
           L 14 62 
           V 34 
           L 32 14 
           V 4 
           H 36 
           V 14 
           H 64 
           V 4 
           H 68 
           V 14 
           L 74 20 
           V 8 
           H 78 
           V 24 
           L 86 34 
           V 62 
           Z"
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
      <rect
        x="43"
        y="30"
        width="14"
        height="12"
        rx="1.5"
        stroke={color}
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}

export default function VisitKoszegLogo({
  showIcon = true,
  showTagline = false,
  size = "md",
  className = ""
}) {
  const iconSizeClass = size === "sm" ? "w-6 h-7" : size === "lg" ? "w-10 h-12" : "w-8 h-9.5";
  const textSizeClass = size === "sm" ? "text-xl sm:text-2xl" : size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
          <VisitKoszegIcon className={iconSizeClass} color="#F59E0B" />
        </div>
      )}
      <div className="flex flex-col justify-center leading-none">
        <div className={`flex items-baseline font-bold tracking-tight ${textSizeClass}`}>
          <span className="font-light text-slate-800 dark:text-white leading-none">
            visit
          </span>
          <span className="font-extrabold text-amber-500 leading-none">
            koszeg
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] font-semibold text-amber-600/80 dark:text-amber-400/80 tracking-[0.2em] uppercase mt-1">
            ORSOLYA-NAPI VÁSÁR
          </span>
        )}
      </div>
    </div>
  );
}
