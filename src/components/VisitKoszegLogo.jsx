import React, { useState, useRef } from 'react';

/**
 * VisitKőszeg Clean Apple Light-Mode Logo with 5-Second Long Press Admin Trigger
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

export default function VisitKoszegLogo({ onClick, onLongPress5s, className = "" }) {
  const [pressProgress, setPressProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);

  const startPress = () => {
    setPressProgress(0);
    isLongPressTriggeredRef.current = false;
    startTimeRef.current = Date.now();
    const duration = 5000; // 5 seconds

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPressProgress(progress);
    }, 50);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setPressProgress(0);
      isLongPressTriggeredRef.current = true;
      if (onLongPress5s) {
        onLongPress5s();
      }
    }, duration);
  };

  const endPress = () => {
    const elapsed = Date.now() - (startTimeRef.current || Date.now());
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPressProgress(0);

    if (!isLongPressTriggeredRef.current && elapsed < 4000 && onClick) {
      onClick();
    }
  };

  return (
    <div
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className={`inline-flex items-center gap-2 select-none cursor-pointer relative py-1 px-1.5 rounded-md hover:opacity-85 transition-all ${className}`}
      title="VisitKőszeg - Vissza a főoldalra"
    >
      {/* 5-second long press progress bar indicator */}
      {pressProgress > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-amber-600 rounded-full transition-all"
          style={{ width: `${pressProgress}%` }}
        />
      )}

      <VisitKoszegIcon className="w-6 h-7" color="#b45309" />
      <div className="flex items-baseline font-semibold tracking-tight text-xl">
        <span className="font-medium text-stone-900">visit</span>
        <span className="font-bold text-amber-700">koszeg</span>
      </div>
    </div>
  );
}
