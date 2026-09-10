import React, { useState, useRef } from 'react';

/**
 * VISITKOSZEG Clean Logo with 5-Second Long Press Admin Trigger
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
  const isPressingRef = useRef(false);

  const startPress = (e) => {
    isPressingRef.current = true;
    setPressProgress(0);
    isLongPressTriggeredRef.current = false;
    startTimeRef.current = Date.now();
    const duration = 5000; // 5 seconds

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    intervalRef.current = setInterval(() => {
      if (!isPressingRef.current) return;
      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPressProgress(progress);
    }, 50);

    timerRef.current = setTimeout(() => {
      if (!isPressingRef.current) return;
      clearInterval(intervalRef.current);
      setPressProgress(0);
      isLongPressTriggeredRef.current = true;
      isPressingRef.current = false;
      if (onLongPress5s) {
        onLongPress5s();
      }
    }, duration);
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPressProgress(0);
    isPressingRef.current = false;
  };

  const endPress = (e) => {
    if (!isPressingRef.current) return;

    const elapsed = Date.now() - (startTimeRef.current || Date.now());
    cancelPress();

    // Only trigger normal onClick if user actually pressed down and released quickly (<4.5s)
    if (!isLongPressTriggeredRef.current && elapsed < 4500 && onClick) {
      onClick();
    }
  };

  return (
    <div
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      className={`inline-flex items-center gap-2 select-none cursor-pointer relative py-1 px-1.5 rounded-md hover:opacity-85 transition-all ${className}`}
      title="VISITKOSZEG - Vissza a főoldalra (5 mp nyomva tartás: Admin belépés)"
    >
      {/* 5-second long press progress bar indicator */}
      {pressProgress > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-amber-600 rounded-full transition-all"
          style={{ width: `${pressProgress}%` }}
        />
      )}

      <div className="flex items-baseline font-black tracking-wider text-lg sm:text-xl uppercase">
        <span className="text-stone-900">VISIT</span>
        <span className="text-amber-700">KOSZEG</span>
      </div>
    </div>
  );
}
