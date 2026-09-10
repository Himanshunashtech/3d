import { useState, useEffect } from "react";
import { useProgress } from "@react-three/drei";

export function SkyShutterLoader() {
  const { progress, active } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Smooth progress calculation
  useEffect(() => {
    const target = active ? Math.min(progress, 99) : 100;
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= target) return prev;
        const diff = target - prev;
        const step = Math.max(0.8, diff * 0.14);
        return Math.min(target, prev + step);
      });
    }, 20);

    return () => clearInterval(interval);
  }, [progress, active]);

  // Trigger shutter open effect when 100%
  useEffect(() => {
    if (displayProgress < 100) return;

    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 300);

    const doneTimer = setTimeout(() => {
      setIsDone(true);
    }, 1500);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [displayProgress]);

  if (isDone) return null;

  const percent = Math.round(displayProgress);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden select-none pointer-events-none ${
        isOpening ? "opacity-100" : "opacity-100"
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP SKY SHUTTER PANEL (Slides Upward)                 */}
      {/* ========================================================= */}
      <div
        className={`absolute inset-x-0 top-0 h-1/2 flex flex-col justify-end transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isOpening ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{
          background: "linear-gradient(180deg, #1e4b7a 0%, #2b6cb0 60%, #4299e1 100%)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        {/* Sky cloud glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/25 via-transparent to-transparent pointer-events-none" />

        {/* Shutter louver lines */}
        <div className="w-full flex flex-col gap-3 pb-3 px-6 opacity-30">
          <div className="h-[2px] w-full bg-sky-200 rounded-full" />
          <div className="h-[2px] w-full bg-sky-200 rounded-full" />
          <div className="h-[2px] w-full bg-sky-200 rounded-full" />
        </div>

        {/* Shutter Seam Trim */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      </div>

      {/* ========================================================= */}
      {/* 2. BOTTOM SKY SHUTTER PANEL (Slides Downward)             */}
      {/* ========================================================= */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 flex flex-col justify-start transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isOpening ? "translate-y-full" : "translate-y-0"
        }`}
        style={{
          background: "linear-gradient(180deg, #4299e1 0%, #3182ce 40%, #1e4b7a 100%)",
          boxShadow: "0 -10px 30px rgba(0,0,0,0.35)",
        }}
      >
        {/* Shutter Seam Trim */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />

        {/* Shutter louver lines */}
        <div className="w-full flex flex-col gap-3 pt-3 px-6 opacity-30">
          <div className="h-[2px] w-full bg-sky-200 rounded-full" />
          <div className="h-[2px] w-full bg-sky-200 rounded-full" />
          <div className="h-[2px] w-full bg-sky-200 rounded-full" />
        </div>

        {/* River reflection tint */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-sky-300/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ========================================================= */}
      {/* 3. SIMPLE CIRCULAR LOADER (Center)                        */}
      {/* ========================================================= */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-out z-20 ${
          isOpening ? "opacity-0 scale-90" : "opacity-100 scale-100"
        }`}
      >
        {/* Circular Progress Ring */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
          {/* Ambient Sun Pulse Glow */}
          <div className="absolute inset-0 rounded-full bg-amber-300/25 blur-xl animate-pulse" />

          {/* SVG Progress Circle */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-sky-950/40"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="url(#skyLoaderGrad)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="skyLoaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Percentage Display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow font-mono">
              {percent}%
            </span>
          </div>
        </div>

        {/* Minimalist Title */}
        <div className="mt-3 sm:mt-5 text-center">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-sky-100 drop-shadow">
            Statue of Unity
          </h2>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs tracking-wider text-sky-200/75">
            Loading 3D Scene...
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. SUNLIGHT BURST ON REVEAL                               */}
      {/* ========================================================= */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-sky-200/40 via-amber-100/30 to-sky-100/40 pointer-events-none transition-opacity duration-700 ${
          isOpening ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
