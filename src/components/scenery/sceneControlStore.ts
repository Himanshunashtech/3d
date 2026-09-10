export type ThemeMode = "day" | "night";

export interface LightShowState {
  active: boolean; // Show/audio soundtrack active
  lightsActive: boolean; // Visual 3D lights & projection active (starts 1 sec after sound)
  timeLeft: number; // 135s down to 0s
  progress: number; // 0.0 to 1.0
  phaseIndex: number; // 0 to 9 (10 distinct lighting themes)
  phaseName: string;
  phaseDesc: string;
  totalPhases: number;
  audioMuted: boolean;
  audioVolume: number; // 0 to 100
}

export type ControlAction =
  | { type: "MOVE_UP" }
  | { type: "MOVE_DOWN" }
  | { type: "SET_HEIGHT"; height: number }
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "ROTATE_LEFT" }
  | { type: "ROTATE_RIGHT" }
  | { type: "TOGGLE_AUTO_ROTATE" }
  | { type: "SET_AUTO_ROTATE"; active: boolean }
  | { type: "RESET_VIEW" }
  | { type: "SET_THEME"; mode: ThemeMode }
  | { type: "TOGGLE_THEME" }
  | { type: "SET_LIGHT_SHOW"; active: boolean }
  | { type: "TOGGLE_LIGHT_SHOW" }
  | { type: "SET_AUDIO_MUTED"; muted: boolean }
  | { type: "SET_AUDIO_VOLUME"; volume: number };

type ControlListener = (action: ControlAction) => void;
type ThemeListener = (mode: ThemeMode) => void;
type LightShowStateListener = (state: LightShowState) => void;
type AutoRotateListener = (active: boolean) => void;

let currentTheme: ThemeMode = "day";
let autoRotateState: boolean = true; // Always orbiting by default unless user stops it

export const SHOW_DURATION = 135; // 2 minutes 15 seconds (135s)
export const YOUTUBE_VIDEO_ID = "_EpmoYFxky8"; // Official Statue of Unity Light & Sound Show Soundtrack
let showDelayTimeoutId: ReturnType<typeof setTimeout> | null = null;
let showTimerId: ReturnType<typeof setInterval> | null = null;

// 10 Distinct Choreographed Lighting Themes (Total 135s = 2:15, with grand Indian Flag finale)
export const LIGHT_SHOW_PHASES = [
  { name: "Saffron Sunrise (Kesariya)", desc: "Courage & Awakening — Radiant Saffron Illumination (00:00 - 00:13)" },
  { name: "Ashoka Blue & Royal Cyan", desc: "Sovereignty & Truth — Deep Azure Blue Illumination (00:13 - 00:26)" },
  { name: "Sacred White & Shanti", desc: "Purity & Peace — Brilliant White Radiance (00:26 - 00:39)" },
  { name: "India Green (Samriddhi)", desc: "Prosperity & Sacred Soil — Emerald Green Glow (00:39 - 00:52)" },
  { name: "Saffron & Green Dual Waves", desc: "Confluence of Energies — Saffron & Green Duotone (00:52 - 01:05)" },
  { name: "Neon Laser Contour Outline", desc: "Laser Mapping Silhouette — Luminous Neon Green Outlines & Contours (01:05 - 01:18)" },
  { name: "Thermal Prismatic Rainbow", desc: "Spectral Laser Mapping — Radiant Gold, Cyan, Magenta & Emerald Spectrum (01:18 - 01:31)" },
  { name: "Realistic Traditional Attire", desc: "True Colors Projection — Sardar Patel in authentic kurta, golden-bordered shawl, and white dhoti (01:31 - 01:44)" },
  { name: "Celestial Cyan & Saffron Split", desc: "Dual-Tone Wash — Radiant Azure Upper Body & Glowing Saffron Lower Dhoti (01:44 - 01:57)" },
  { name: "Grand Tiranga (Indian Flag Finale)", desc: "Patriotic Climax — Full Indian Flag Projection with 24-Spoke Blue Ashoka Chakra on Statue & Dam (01:57 - 02:15)" },
];

let lightShowState: LightShowState = {
  active: false,
  lightsActive: false,
  timeLeft: SHOW_DURATION,
  progress: 0,
  phaseIndex: 0,
  phaseName: LIGHT_SHOW_PHASES[0]?.name ?? "Saffron Sunrise",
  phaseDesc: LIGHT_SHOW_PHASES[0]?.desc ?? "",
  totalPhases: LIGHT_SHOW_PHASES.length,
  audioMuted: false,
  audioVolume: 85,
};

const controlListeners = new Set<ControlListener>();
const themeListeners = new Set<ThemeListener>();
const lightShowListeners = new Set<LightShowStateListener>();
const autoRotateListeners = new Set<AutoRotateListener>();

export function getThemeMode(): ThemeMode {
  return currentTheme;
}

export function getAutoRotate(): boolean {
  return autoRotateState;
}

export function subscribeAutoRotate(listener: AutoRotateListener) {
  autoRotateListeners.add(listener);
  listener(autoRotateState);
  return () => {
    autoRotateListeners.delete(listener);
  };
}

export function setAutoRotateState(active: boolean) {
  autoRotateState = active;
  autoRotateListeners.forEach((l) => l(autoRotateState));
}

export function getLightShowState(): LightShowState {
  return { ...lightShowState };
}

export function getLightShow(): boolean {
  return lightShowState.active && lightShowState.lightsActive;
}

export function subscribeControls(listener: ControlListener) {
  controlListeners.add(listener);
  return () => {
    controlListeners.delete(listener);
  };
}

export function subscribeTheme(listener: ThemeListener) {
  themeListeners.add(listener);
  listener(currentTheme);
  return () => {
    themeListeners.delete(listener);
  };
}

export function subscribeLightShow(listener: (active: boolean) => void) {
  const wrapped: LightShowStateListener = (state) => listener(state.active && state.lightsActive);
  lightShowListeners.add(wrapped);
  listener(lightShowState.active && lightShowState.lightsActive);
  return () => {
    lightShowListeners.delete(wrapped);
  };
}

export function subscribeLightShowState(listener: LightShowStateListener) {
  lightShowListeners.add(listener);
  listener({ ...lightShowState });
  return () => {
    lightShowListeners.delete(listener);
  };
}

function notifyLightShowListeners() {
  const copy = { ...lightShowState };
  lightShowListeners.forEach((l) => l(copy));
}

function computePhase(elapsed: number): { index: number; name: string; desc: string } {
  // 135s (2:15) choreographed phase mapping across 10 distinct themes:
  let idx = 0;
  if (elapsed < 13) idx = 0;
  else if (elapsed < 26) idx = 1;
  else if (elapsed < 39) idx = 2;
  else if (elapsed < 52) idx = 3;
  else if (elapsed < 65) idx = 4;
  else if (elapsed < 78) idx = 5;
  else if (elapsed < 91) idx = 6;
  else if (elapsed < 104) idx = 7;
  else if (elapsed < 117) idx = 8;
  else idx = 9;

  const p = LIGHT_SHOW_PHASES[idx] ?? LIGHT_SHOW_PHASES[0]!;
  return { index: idx, name: p.name, desc: p.desc };
}

function startLightShowTimer() {
  stopLightShowTimer();

  // Sound starts immediately (active: true), visual 3D lights start 1 sec later (lightsActive: false)
  lightShowState = {
    ...lightShowState,
    active: true,
    lightsActive: false,
    timeLeft: SHOW_DURATION,
    progress: 0,
    phaseIndex: 0,
    phaseName: LIGHT_SHOW_PHASES[0]?.name ?? "Saffron Sunrise",
    phaseDesc: LIGHT_SHOW_PHASES[0]?.desc ?? "",
    totalPhases: LIGHT_SHOW_PHASES.length,
  };
  notifyLightShowListeners();

  // After 1 second (1000ms) of sound playing, activate the 3D lighting show
  showDelayTimeoutId = setTimeout(() => {
    showDelayTimeoutId = null;
    lightShowState = {
      ...lightShowState,
      lightsActive: true,
    };
    notifyLightShowListeners();

    showTimerId = setInterval(() => {
      const nextTime = lightShowState.timeLeft - 1;
      if (nextTime <= 0) {
        stopLightShowTimer();
        lightShowState = {
          ...lightShowState,
          active: false,
          lightsActive: false,
          timeLeft: SHOW_DURATION,
          progress: 1,
          phaseIndex: 0,
          phaseName: LIGHT_SHOW_PHASES[0]?.name ?? "Saffron Sunrise",
          phaseDesc: LIGHT_SHOW_PHASES[0]?.desc ?? "",
          totalPhases: LIGHT_SHOW_PHASES.length,
        };
        notifyLightShowListeners();
      } else {
        const elapsed = SHOW_DURATION - nextTime;
        const phase = computePhase(elapsed);
        lightShowState = {
          ...lightShowState,
          active: true,
          lightsActive: true,
          timeLeft: nextTime,
          progress: elapsed / SHOW_DURATION,
          phaseIndex: phase.index,
          phaseName: phase.name,
          phaseDesc: phase.desc,
          totalPhases: LIGHT_SHOW_PHASES.length,
        };
        notifyLightShowListeners();
      }
    }, 1000);
  }, 1000);
}

function stopLightShowTimer() {
  if (showDelayTimeoutId !== null) {
    clearTimeout(showDelayTimeoutId);
    showDelayTimeoutId = null;
  }
  if (showTimerId !== null) {
    clearInterval(showTimerId);
    showTimerId = null;
  }
}

export function dispatchControl(action: ControlAction) {
  if (action.type === "SET_THEME") {
    currentTheme = action.mode;
    if (currentTheme === "day") {
      stopLightShowTimer();
      lightShowState = {
        ...lightShowState,
        active: false,
        lightsActive: false,
        timeLeft: SHOW_DURATION,
        progress: 0,
      };
      notifyLightShowListeners();
    }
    themeListeners.forEach((l) => l(currentTheme));
  } else if (action.type === "TOGGLE_THEME") {
    currentTheme = currentTheme === "day" ? "night" : "day";
    if (currentTheme === "day") {
      stopLightShowTimer();
      lightShowState = {
        ...lightShowState,
        active: false,
        lightsActive: false,
        timeLeft: SHOW_DURATION,
        progress: 0,
      };
      notifyLightShowListeners();
    }
    themeListeners.forEach((l) => l(currentTheme));
  } else if (action.type === "SET_LIGHT_SHOW") {
    if (action.active) {
      if (currentTheme !== "night") {
        currentTheme = "night";
        themeListeners.forEach((l) => l(currentTheme));
      }
      startLightShowTimer();
    } else {
      stopLightShowTimer();
      lightShowState = {
        ...lightShowState,
        active: false,
        lightsActive: false,
        timeLeft: SHOW_DURATION,
        progress: 0,
      };
      notifyLightShowListeners();
    }
  } else if (action.type === "TOGGLE_LIGHT_SHOW") {
    if (!lightShowState.active) {
      if (currentTheme !== "night") {
        currentTheme = "night";
        themeListeners.forEach((l) => l(currentTheme));
      }
      startLightShowTimer();
    } else {
      stopLightShowTimer();
      lightShowState = {
        ...lightShowState,
        active: false,
        lightsActive: false,
        timeLeft: SHOW_DURATION,
        progress: 0,
      };
      notifyLightShowListeners();
    }
  } else if (action.type === "TOGGLE_AUTO_ROTATE") {
    autoRotateState = !autoRotateState;
    autoRotateListeners.forEach((l) => l(autoRotateState));
  } else if (action.type === "SET_AUTO_ROTATE") {
    autoRotateState = action.active;
    autoRotateListeners.forEach((l) => l(autoRotateState));
  } else if (action.type === "SET_AUDIO_MUTED") {
    lightShowState = {
      ...lightShowState,
      audioMuted: action.muted,
    };
    notifyLightShowListeners();
  } else if (action.type === "SET_AUDIO_VOLUME") {
    lightShowState = {
      ...lightShowState,
      audioVolume: Math.max(0, Math.min(100, action.volume)),
    };
    notifyLightShowListeners();
  }
  controlListeners.forEach((listener) => listener(action));
}
