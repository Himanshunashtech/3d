import { useEffect, useRef, useState } from "react";
import { subscribeLightShowState } from "./sceneControlStore";

/**
 * Procedural Nature Soundscape:
 * - Soothing Mountain Breeze & Wind Gusts
 * - Flowing Narmada River Water & Rushing Rapids
 * - Rich Melodic Forest Bird Songs & Chirps
 * Generated entirely with Web Audio API (Zero audio downloads, instant playback).
 * 
 * Configured to be ALWAYS ON by default unless explicitly stopped by the user.
 */
export function AmbientSound() {
  const [on, setOn] = useState(true);
  const userExplicitlyStoppedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const isShowActiveRef = useRef(false);

  const stop = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    nodesRef.current.forEach((n) => {
      try {
        (n as AudioScheduledSourceNode).stop?.();
      } catch {
        /* already stopped */
      }
      try {
        n.disconnect();
      } catch {}
    });
    nodesRef.current = [];

    if (masterRef.current && ctxRef.current) {
      try {
        masterRef.current.gain.linearRampToValueAtTime(0.001, ctxRef.current.currentTime + 0.4);
      } catch {}
    }

    setTimeout(() => {
      masterRef.current?.disconnect();
      masterRef.current = null;
      void ctxRef.current?.close();
      ctxRef.current = null;
    }, 450);
  };

  const start = () => {
    if (userExplicitlyStoppedRef.current) return;

    if (ctxRef.current) {
      if (ctxRef.current.state === "suspended") {
        void ctxRef.current.resume();
        return;
      }
      if (ctxRef.current.state === "running") {
        return;
      }
    }

    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    const targetGain = isShowActiveRef.current ? 0.18 : 0.55;
    master.gain.value = 0.001;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 1.2);
    masterRef.current = master;

    // =========================================================================
    // 1. PROCEDURAL PINK & BROWN NOISE BUFFERS (Warm, Natural Acoustic Base)
    // =========================================================================
    const sampleRate = ctx.sampleRate;
    const noiseDuration = 6; // 6-second seamless noise loops
    const bufferSize = sampleRate * noiseDuration;

    // Pink / Brownian noise for deep water current and gentle air
    const brownBuffer = ctx.createBuffer(2, bufferSize, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const out = brownBuffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brownian filter
        lastOut = (lastOut + 0.025 * white) / 1.025;
        out[i] = lastOut * 3.2;
      }
    }

    // Pink noise for water splashing ripples and foliage breeze
    const pinkBuffer = ctx.createBuffer(2, bufferSize, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const out = pinkBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    // =========================================================================
    // 2. FLOWING NARMADA RIVER WATER SOUND (Current + Ripples + Splashes)
    // =========================================================================
    // A. Deep Water Current / River Bed Rumble
    const riverBed = ctx.createBufferSource();
    riverBed.buffer = brownBuffer;
    riverBed.loop = true;

    const riverBedFilter = ctx.createBiquadFilter();
    riverBedFilter.type = "lowpass";
    riverBedFilter.frequency.value = 320;
    riverBedFilter.Q.value = 1.0;

    const riverBedGain = ctx.createGain();
    riverBedGain.gain.value = 0.38;

    // Slow surging river current LFO (gentle water waves)
    const riverWaveLFO = ctx.createOscillator();
    riverWaveLFO.frequency.value = 0.18; // ~5.5 second wave cycle
    const riverWaveGain = ctx.createGain();
    riverWaveGain.gain.value = 0.12;
    riverWaveLFO.connect(riverWaveGain).connect(riverBedGain.gain);

    riverBed.connect(riverBedFilter).connect(riverBedGain).connect(master);
    riverBed.start();
    riverWaveLFO.start();
    nodesRef.current.push(riverBed, riverWaveLFO, riverBedFilter, riverBedGain, riverWaveGain);

    // B. River Surface Rushing Water & Rapids (Resonant Bandpass Texture)
    const riverRapids = ctx.createBufferSource();
    riverRapids.buffer = pinkBuffer;
    riverRapids.loop = true;

    const rapidsFilter = ctx.createBiquadFilter();
    rapidsFilter.type = "bandpass";
    rapidsFilter.frequency.value = 950;
    rapidsFilter.Q.value = 1.8;

    const rapidsGain = ctx.createGain();
    rapidsGain.gain.value = 0.28;

    // Rapid water turbulence modulation
    const rapidsLFO = ctx.createOscillator();
    rapidsLFO.frequency.value = 1.2;
    const rapidsLFOGain = ctx.createGain();
    rapidsLFOGain.gain.value = 240;
    rapidsLFO.connect(rapidsLFOGain).connect(rapidsFilter.frequency);

    riverRapids.connect(rapidsFilter).connect(rapidsGain).connect(master);
    riverRapids.start();
    rapidsLFO.start();
    nodesRef.current.push(riverRapids, rapidsLFO, rapidsFilter, rapidsGain, rapidsLFOGain);

    // =========================================================================
    // 3. MOUNTAIN BREEZE & WIND GUSTS (Swelling Airy Ambience)
    // =========================================================================
    const breezeSource = ctx.createBufferSource();
    breezeSource.buffer = brownBuffer;
    breezeSource.loop = true;

    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = "bandpass";
    breezeFilter.frequency.value = 480;
    breezeFilter.Q.value = 0.65;

    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.20;

    // Dynamic wind gust swelling LFO
    const windGustLFO = ctx.createOscillator();
    windGustLFO.frequency.value = 0.055; // Long breathing gusts
    const windGustGain = ctx.createGain();
    windGustGain.gain.value = 280;
    windGustLFO.connect(windGustGain).connect(breezeFilter.frequency);

    breezeSource.connect(breezeFilter).connect(breezeGain).connect(master);
    breezeSource.start();
    windGustLFO.start();
    nodesRef.current.push(breezeSource, windGustLFO, breezeFilter, breezeGain, windGustGain);

    // =========================================================================
    // 4. RICH MELODIC FOREST BIRDS (Warbles, Whistles & Staccato Calls)
    // =========================================================================
    const playBirdCall = () => {
      if (!ctxRef.current || ctxRef.current.state === "closed") return;
      const now = ctx.currentTime;
      const callType = Math.floor(Math.random() * 3);

      if (callType === 0) {
        // --- 1. Sweet Two-Tone Melodic Whistle (e.g. Robin / Cuckoo)
        const baseFreq = 2200 + Math.random() * 600;
        const notes = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < notes; i++) {
          const startTime = now + i * 0.18;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          const f = baseFreq * (i === 0 ? 1.0 : (Math.random() > 0.5 ? 1.25 : 0.85));
          osc.frequency.setValueAtTime(f, startTime);
          osc.frequency.exponentialRampToValueAtTime(f * 1.08, startTime + 0.07);
          osc.frequency.exponentialRampToValueAtTime(f * 0.95, startTime + 0.14);

          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

          osc.connect(gain).connect(master);
          osc.start(startTime);
          osc.stop(startTime + 0.15);
        }
      } else if (callType === 1) {
        // --- 2. Vibrant FM Warble / Nightingale Chirp
        const baseFreq = 2800 + Math.random() * 1200;
        const count = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          const t = now + i * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(baseFreq * 0.85, t);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, t + 0.035);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, t + 0.065);

          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.22, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

          osc.connect(gain).connect(master);
          osc.start(t);
          osc.stop(t + 0.07);
        }
      } else {
        // --- 3. Distant Gentle Forest Trill
        const f = 1900 + Math.random() * 800;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const tremolo = ctx.createOscillator();
        const tremGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.15, now + 0.35);

        tremolo.frequency.value = 18; // 18 Hz fast trill
        tremGain.gain.value = 0.08;
        tremolo.connect(tremGain).connect(gain.gain);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.40);

        osc.connect(gain).connect(master);
        osc.start(now);
        tremolo.start(now);
        osc.stop(now + 0.42);
        tremolo.stop(now + 0.42);
      }

      // Schedule next birdsong with organic randomized pause (1.2s to 4.5s)
      timerRef.current = window.setTimeout(playBirdCall, 1200 + Math.random() * 3300);
    };

    // Begin bird songs shortly after start
    timerRef.current = window.setTimeout(playBirdCall, 600);
  };

  // Auto-start ambient nature soundscape on load & handle browser autoplay gesture unlock
  useEffect(() => {
    let unmounted = false;

    const tryAutoStart = () => {
      if (userExplicitlyStoppedRef.current || unmounted) return;
      if (!ctxRef.current) {
        start();
      } else if (ctxRef.current.state === "suspended") {
        void ctxRef.current.resume();
      }
    };

    // 1. Attempt immediate auto-play
    tryAutoStart();

    // 2. Global user interaction listener to resume if browser blocked synchronous autoplay
    const resumeEvents = ["pointerdown", "touchstart", "click", "keydown", "wheel"];
    const handleGesture = () => {
      if (userExplicitlyStoppedRef.current) return;
      tryAutoStart();
      if (ctxRef.current && ctxRef.current.state === "running") {
        resumeEvents.forEach((ev) => window.removeEventListener(ev, handleGesture));
      }
    };

    resumeEvents.forEach((ev) => window.addEventListener(ev, handleGesture, { passive: true }));

    return () => {
      unmounted = true;
      resumeEvents.forEach((ev) => window.removeEventListener(ev, handleGesture));
      stop();
    };
  }, []);

  // Softly duck ambient nature soundscape during the 2:15 Night Light Show soundtrack
  useEffect(() => {
    return subscribeLightShowState((state) => {
      isShowActiveRef.current = state.active;
      if (masterRef.current && ctxRef.current) {
        const targetGain = state.active ? 0.18 : 0.55;
        try {
          masterRef.current.gain.linearRampToValueAtTime(targetGain, ctxRef.current.currentTime + 0.6);
        } catch {}
      }
    });
  }, []);

  const toggle = () => {
    if (on) {
      userExplicitlyStoppedRef.current = true;
      stop();
      setOn(false);
    } else {
      userExplicitlyStoppedRef.current = false;
      start();
      setOn(true);
    }
  };

  return (
    <button
      id="btn-sound-toggle"
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute Nature Ambience (Breeze, River & Birds)" : "Play Nature Ambience (Breeze, River & Birds)"}
      title={on ? "Mute Nature Ambience" : "Play Nature Ambience (Mountain Breeze, River Flow & Birds)"}
      className={`pointer-events-auto fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] sm:top-8 sm:right-8 z-30 flex items-center gap-1.5 rounded-full border px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs backdrop-blur-md transition-all active:scale-95 shadow-md ${
        on
          ? "border-emerald-400/40 bg-sky-950/70 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)] font-medium"
          : "border-sky-300/20 bg-sky-950/60 text-sky-300/60 hover:bg-sky-900/80"
      }`}
    >
      <span className="text-sm leading-none">{on ? "🍃" : "🔇"}</span>
      <span className="hidden sm:inline">
        {on ? "Ambience: On" : "Ambience: Off"}
      </span>
      {on && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
    </button>
  );
}

