import { useEffect, useRef, useState } from "react";
import {
  subscribeLightShowState,
  getLightShowState,
  LightShowState,
  YOUTUBE_VIDEO_ID,
} from "./sceneControlStore";

declare global {
  interface Window {
    YT?: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Synchronized YouTube Soundtrack Audio Player for the 2:15 Night Light Show
 * Video ID: _EpmoYFxky8 (https://www.youtube.com/watch?v=_EpmoYFxky8)
 * 
 * - Seamlessly plays the audio soundtrack when the 2:15 Light Show is activated.
 * - Auto-pauses and resets when the show finishes or is toggled off.
 * - Supports real-time volume adjustment and mute toggling.
 */
export function LightShowAudioPlayer() {
  const [showState, setShowState] = useState<LightShowState>(getLightShowState());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const isApiReady = useRef(false);

  // Subscribe to light show state changes
  useEffect(() => {
    return subscribeLightShowState((state) => {
      setShowState(state);
    });
  }, []);

  // Initialize YouTube IFrame API
  useEffect(() => {
    const tagId = "youtube-iframe-api-script";
    if (!document.getElementById(tagId)) {
      const script = document.createElement("script");
      script.id = tagId;
      script.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
      } else {
        document.head.appendChild(script);
      }
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onReady: () => {
                isApiReady.current = true;
                const currentState = getLightShowState();
                if (currentState.active) {
                  ytPlayerRef.current?.unMute();
                  ytPlayerRef.current?.setVolume(currentState.audioVolume);
                  ytPlayerRef.current?.seekTo(0, true);
                  ytPlayerRef.current?.playVideo();
                }
              },
            },
          });
        } catch (e) {
          console.warn("YouTube API init fallback:", e);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevHandler) prevHandler();
        initPlayer();
      };
    }

    return () => {
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
      }
    };
  }, []);

  // PostMessage command sender for iframe fallback
  const sendIframeCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  };

  // Sync play/pause with light show active state
  useEffect(() => {
    if (showState.active) {
      // Unmute & Set Volume
      if (showState.audioMuted) {
        if (ytPlayerRef.current?.mute) ytPlayerRef.current.mute();
        sendIframeCommand("mute");
      } else {
        if (ytPlayerRef.current?.unMute) ytPlayerRef.current.unMute();
        sendIframeCommand("unMute");
        if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(showState.audioVolume);
        sendIframeCommand("setVolume", [showState.audioVolume]);
      }

      // Seek to beginning and play
      if (ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
      }
      sendIframeCommand("seekTo", [0, true]);
      sendIframeCommand("playVideo");
    } else {
      // Pause video when show ends or is turned off
      if (ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      }
      sendIframeCommand("pauseVideo");
    }
  }, [showState.active]);

  // Sync volume changes
  useEffect(() => {
    if (ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(showState.audioVolume);
    }
    sendIframeCommand("setVolume", [showState.audioVolume]);
  }, [showState.audioVolume]);

  // Sync mute toggle
  useEffect(() => {
    if (showState.audioMuted) {
      if (ytPlayerRef.current?.mute) ytPlayerRef.current.mute();
      sendIframeCommand("mute");
    } else {
      if (ytPlayerRef.current?.unMute) ytPlayerRef.current.unMute();
      sendIframeCommand("unMute");
      if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(showState.audioVolume);
      sendIframeCommand("setVolume", [showState.audioVolume]);
    }
  }, [showState.audioMuted]);

  // Render hidden background player with official video URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&autoplay=0&controls=0&disablekb=1&fs=0&loop=0&modestbranding=1&playsinline=1&rel=0&origin=${encodeURIComponent(
    origin
  )}`;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        width: "1px",
        height: "1px",
        bottom: "-100px",
        left: "-100px",
        opacity: 0.001,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: -999,
      }}
    >
      <iframe
        ref={iframeRef}
        id="yt-lightshow-soundtrack-iframe"
        title="Statue of Unity Light Show Soundtrack"
        src={embedUrl}
        width="1"
        height="1"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
}
