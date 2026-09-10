import { useState, useEffect } from "react";
import {
  dispatchControl,
  subscribeTheme,
  getThemeMode,
  subscribeLightShowState,
  getLightShowState,
  subscribeAutoRotate,
  getAutoRotate,
  LightShowState,
  ThemeMode,
} from "./sceneControlStore";
import { LightShowAudioPlayer } from "./LightShowAudioPlayer";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
}

export function Overlay() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode());
  const [showState, setShowState] = useState<LightShowState>(getLightShowState());
  const [autoRotate, setAutoRotate] = useState<boolean>(getAutoRotate());

  useEffect(() => {
    return subscribeTheme((mode) => {
      setThemeMode(mode);
    });
  }, []);

  useEffect(() => {
    return subscribeLightShowState((state) => {
      setShowState(state);
    });
  }, []);

  useEffect(() => {
    return subscribeAutoRotate((active) => {
      setAutoRotate(active);
    });
  }, []);

  const handleToggleTheme = () => {
    dispatchControl({ type: "TOGGLE_THEME" });
  };

  const handleToggleLightShow = () => {
    dispatchControl({ type: "TOGGLE_LIGHT_SHOW" });
  };

  const handleToggleAutoRotate = () => {
    dispatchControl({ type: "TOGGLE_AUTO_ROTATE" });
  };

  return (
    <>
      {/* Background Synchronized YouTube Soundtrack Player */}
      <LightShowAudioPlayer />

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] select-none">
        {/* Desktop Top Header (Hidden on Mobile to keep Statue face 100% unobstructed) */}
        <header id="monument-header" className="hidden sm:block max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-950/50 px-3.5 py-1 text-xs uppercase tracking-[0.3em] text-sky-200 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Interactive 3D Monument
            </div>

            {/* 360° Auto-Orbit Switcher */}
            <button
              id="btn-orbit-toggle-desktop"
              onClick={handleToggleAutoRotate}
              aria-label={`Switch 360° Auto-Orbit ${autoRotate ? "Off" : "On"}`}
              title={autoRotate ? "Pause 360° Auto-Orbit" : "Resume 360° Auto-Orbit"}
              className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-md border backdrop-blur-md ${
                autoRotate
                  ? "bg-sky-500/25 text-sky-100 border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.3)] font-bold"
                  : "bg-sky-950/60 text-sky-300/60 border-sky-300/20 hover:bg-sky-900/80"
              }`}
            >
              <span>{autoRotate ? "🔄" : "⏸️"}</span>
              <span>{autoRotate ? "Orbit: On" : "Orbit: Paused"}</span>
            </button>

            {/* Day / Night Theme Switcher */}
            <button
              id="btn-theme-toggle-desktop"
              onClick={handleToggleTheme}
              aria-label={`Switch to ${themeMode === "day" ? "Night Illumination" : "Daylight"} mode`}
              title="Toggle Day / Night Illumination"
              className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-md border backdrop-blur-md ${
                themeMode === "night"
                  ? "bg-amber-400 text-sky-950 border-amber-300 font-extrabold shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                  : "bg-sky-950/60 text-sky-100 border-sky-300/30 hover:bg-sky-900/80"
              }`}
            >
              <span>{themeMode === "night" ? "🌙" : "☀️"}</span>
              <span>{themeMode === "night" ? "Night Lights" : "Day Mode"}</span>
            </button>

            {/* Indian Flag 2:15 Light & Sound Show Button (Only in Night Mode) */}
            {themeMode === "night" && (
              <button
                id="btn-light-show-toggle-desktop"
                onClick={handleToggleLightShow}
                aria-label="Toggle 2:15 Minute Indian Flag Light & Sound Show"
                title="Toggle 2:15 Minute Indian Flag Light & Sound Show"
                className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide transition-all active:scale-95 shadow-md border backdrop-blur-md ${
                  showState.active
                    ? "bg-slate-950 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.7)] ring-2 ring-emerald-400"
                    : "bg-sky-950/60 text-sky-100 border-sky-300/30 hover:bg-sky-900/80"
                }`}
              >
                <span className="text-sm leading-none">🇮🇳</span>
                <span>
                  {showState.active
                    ? `Show: ${formatTime(showState.timeLeft)}`
                    : "🇮🇳 2:15 Light Show"}
                </span>
                {showState.active && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                )}
              </button>
            )}
          </div>

          <h1 id="monument-title" className="mt-2 text-3xl lg:text-4xl font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Statue of Unity
          </h1>
          <p id="monument-description" className="mt-1 text-sm text-sky-100/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] max-w-xl">
            Sadhu Bet Island, Narmada Valley, Gujarat — 182m Colossal Monument
          </p>
        </header>

        {/* Empty space on mobile so the top area and Statue face are unobstructed */}
        <div className="sm:hidden" />

        {/* Bottom Area: Controls & Navigation Hints */}
        <footer id="bottom-bar-container" className="flex flex-col items-start gap-2 sm:gap-3 w-full max-w-xl">
          {/* Mobile Title & Heading (Placed at bottom on mobile) */}
          <div className="sm:hidden pointer-events-auto">
            <h1 id="monument-title-mobile" className="text-lg font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              Statue of Unity
            </h1>
            <p id="monument-description-mobile" className="text-[10px] text-sky-100/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              Sadhu Bet Island, Narmada Valley, Gujarat — 182m Monument
            </p>
          </div>

          {/* Buttons Row with original UI styling: Badge, Orbit, Night Mode, Light Show */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Interactive 3D Monument Badge (On mobile at bottom) */}
            <div className="inline-flex sm:hidden items-center gap-1.5 rounded-full border border-sky-300/30 bg-sky-950/50 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-sky-200 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Interactive 3D</span>
            </div>

            {/* 360° Auto-Orbit Switcher */}
            <button
              id="btn-orbit-toggle"
              onClick={handleToggleAutoRotate}
              aria-label={`Switch 360° Auto-Orbit ${autoRotate ? "Off" : "On"}`}
              title={autoRotate ? "Pause 360° Auto-Orbit" : "Resume 360° Auto-Orbit"}
              className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-md border backdrop-blur-md ${
                autoRotate
                  ? "bg-sky-500/25 text-sky-100 border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.3)] font-bold"
                  : "bg-sky-950/60 text-sky-300/60 border-sky-300/20 hover:bg-sky-900/80"
              }`}
            >
              <span>{autoRotate ? "🔄" : "⏸️"}</span>
              <span>{autoRotate ? "Orbit: On" : "Orbit: Paused"}</span>
            </button>

            {/* Day / Night Theme Switcher */}
            <button
              id="btn-theme-toggle"
              onClick={handleToggleTheme}
              aria-label={`Switch to ${themeMode === "day" ? "Night Illumination" : "Daylight"} mode`}
              title="Toggle Day / Night Illumination"
              className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-md border backdrop-blur-md ${
                themeMode === "night"
                  ? "bg-amber-400 text-sky-950 border-amber-300 font-extrabold shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                  : "bg-sky-950/60 text-sky-100 border-sky-300/30 hover:bg-sky-900/80"
              }`}
            >
              <span>{themeMode === "night" ? "🌙" : "☀️"}</span>
              <span>{themeMode === "night" ? "Night Lights" : "Day Mode"}</span>
            </button>

            {/* Indian Flag 2:15 Light & Sound Show Button (Only in Night Mode) */}
            {themeMode === "night" && (
              <button
                id="btn-light-show-toggle"
                onClick={handleToggleLightShow}
                aria-label="Toggle 2:15 Minute Indian Flag Light & Sound Show"
                title="Toggle 2:15 Minute Indian Flag Light & Sound Show"
                className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold tracking-wide transition-all active:scale-95 shadow-md border backdrop-blur-md ${
                  showState.active
                    ? "bg-slate-950 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.7)] ring-2 ring-emerald-400"
                    : "bg-sky-950/60 text-sky-100 border-sky-300/30 hover:bg-sky-900/80"
                }`}
              >
                <span className="text-sm leading-none">🇮🇳</span>
                <span>
                  {showState.active
                    ? `Show: ${formatTime(showState.timeLeft)}`
                    : "🇮🇳 2:15 Light Show"}
                </span>
                {showState.active && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                )}
              </button>
            )}
          </div>

          {/* Footer Hints (Touch & Mouse Responsive) */}
          <div id="footer-navigation-hints" className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-sky-100/90 max-w-[90%] sm:max-w-none">
            <span className="rounded-full border border-sky-300/30 bg-sky-950/45 px-2.5 py-1 sm:px-3.5 sm:py-1.5 backdrop-blur-md shadow-sm">
              👆 Drag to Orbit
            </span>
            <span className="rounded-full border border-sky-300/30 bg-sky-950/45 px-2.5 py-1 sm:px-3.5 sm:py-1.5 backdrop-blur-md shadow-sm">
              ✌️ Pinch / Scroll to Zoom
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}

