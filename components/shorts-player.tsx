"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  ChevronDown,
  ChevronUp,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const HIDE_DELAY_MS = 2000;
const SEEK_STEP_S = 5;
const WHEEL_THROTTLE_MS = 400;

export type ShortsDemo = {
  src: string;
  title: string;
  category: string;
  description: string;
};

export type ShortsPlayerProps = {
  open: boolean;
  onClose: () => void;
  demos: ShortsDemo[];
  startIdx: number;
};

type Outgoing = { demo: ShortsDemo; dir: "up" | "down" };

export function ShortsPlayer({
  open,
  onClose,
  demos,
  startIdx,
}: ShortsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWheelRef = useRef(0);

  const [idx, setIdx] = useState(startIdx);
  const [outgoing, setOutgoing] = useState<Outgoing | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const current = demos[idx] ?? null;
  const hasMultiple = demos.length > 1;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(
      () => setControlsVisible(false),
      HIDE_DELAY_MS,
    );
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearHideTimeout();
    const v = videoRef.current;
    if (v && !v.paused && !v.ended) scheduleHide();
  }, [scheduleHide]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (stageRef.current) {
      void stageRef.current.requestFullscreen();
    }
  }, []);

  const seekBy = useCallback((deltaS: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(
      0,
      Math.min(v.duration || 0, v.currentTime + deltaS),
    );
  }, []);

  const navigate = useCallback(
    (delta: 1 | -1) => {
      if (!hasMultiple) return;
      if (outgoing) return; // mid-transition
      const dir: "up" | "down" = delta > 0 ? "up" : "down";
      setOutgoing({ demo: demos[idx], dir });
      setIdx((i) => (i + delta + demos.length) % demos.length);
    },
    [demos, idx, outgoing, hasMultiple],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      clearHideTimeout();
      setOutgoing(null);
      setIsPlaying(false);
      setControlsVisible(true);
      setCurrentTime(0);
      setDuration(0);
      setIsMuted(true);
      setVolume(1);
      onClose();
    }
  };

  // Sync mute/volume to video element.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
    v.volume = volume;
  }, [isMuted, volume, idx]);

  // Track fullscreen state.
  useEffect(() => {
    const handler = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-SEEK_STEP_S);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(SEEK_STEP_S);
          break;
        case "ArrowUp":
          e.preventDefault();
          navigate(-1);
          break;
        case "ArrowDown":
          e.preventDefault();
          navigate(1);
          break;
        default:
          return;
      }
      showControls();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    open,
    togglePlay,
    toggleMute,
    toggleFullscreen,
    seekBy,
    showControls,
    navigate,
  ]);

  // Mouse wheel navigation. Listener lives on document so it works even when
  // the stage ref hasn't attached yet (Dialog.Portal mounts async).
  useEffect(() => {
    if (!open) return;
    const onWheel = (e: WheelEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      if (!stage.contains(e.target as Node)) return;
      if (Math.abs(e.deltaY) < 10) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelRef.current < WHEEL_THROTTLE_MS) return;
      lastWheelRef.current = now;
      navigate(e.deltaY > 0 ? 1 : -1);
    };
    document.addEventListener("wheel", onWheel, { passive: false });
    return () => document.removeEventListener("wheel", onWheel);
  }, [open, navigate]);

  const onMouseLeave = () => {
    const v = videoRef.current;
    if (v && !v.paused) setControlsVisible(false);
  };

  const onPlay = () => {
    setIsPlaying(true);
    scheduleHide();
  };
  const onPause = () => {
    setIsPlaying(false);
    setControlsVisible(true);
    clearHideTimeout();
  };
  const onEnded = () => {
    setIsPlaying(false);
    setControlsVisible(true);
    clearHideTimeout();
  };
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (v) setCurrentTime(v.currentTime);
  };
  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    void v.play().catch(() => {
      setIsPlaying(false);
      setControlsVisible(true);
    });
  };

  const onIncomingAnimEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    setOutgoing(null);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePct = (isMuted ? 0 : volume) * 100;

  if (!current) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none">
          <Dialog.Title className="sr-only">{current.title}</Dialog.Title>
          <div className="relative">
            <div
              ref={stageRef}
              onMouseMove={showControls}
              onMouseLeave={onMouseLeave}
              className="reelink-stage relative h-[calc(100dvh-2rem)] aspect-[9/16] max-w-[calc(100dvw-2rem)] overflow-hidden rounded-2xl bg-black shadow-2xl"
            >
              {/* Outgoing video (only during transition) */}
              {outgoing && (
                <div
                  key={`out-${outgoing.demo.src}`}
                  className={cn(
                    "absolute inset-0",
                    outgoing.dir === "up" && "reelink-slide-out-up",
                    outgoing.dir === "down" && "reelink-slide-out-down",
                  )}
                >
                  <video
                    src={outgoing.demo.src}
                    muted
                    playsInline
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              {/* Incoming / current video */}
              <div
                key={`in-${current.src}`}
                onAnimationEnd={onIncomingAnimEnd}
                className={cn(
                  "absolute inset-0",
                  outgoing?.dir === "up" && "reelink-slide-in-up",
                  outgoing?.dir === "down" && "reelink-slide-in-down",
                )}
              >
                <video
                  ref={videoRef}
                  src={current.src}
                  autoPlay
                  muted
                  playsInline
                  onClick={togglePlay}
                  onPlay={onPlay}
                  onPause={onPause}
                  onEnded={onEnded}
                  onTimeUpdate={onTimeUpdate}
                  onLoadedMetadata={onLoadedMetadata}
                  className="h-full w-full cursor-pointer object-contain"
                />
              </div>

              {/* Top controls */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10 transition-opacity duration-200",
                  controlsVisible ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="pointer-events-auto flex items-center gap-2">
                  <ControlButton
                    onClick={togglePlay}
                    label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="size-5" fill="currentColor" />
                    ) : (
                      <Play
                        className="size-5 translate-x-px"
                        fill="currentColor"
                      />
                    )}
                  </ControlButton>

                  <VolumeControl
                    muted={isMuted}
                    volume={volume}
                    volumePct={volumePct}
                    onToggleMute={toggleMute}
                    onVolumeChange={(v) => {
                      setVolume(v);
                      setIsMuted(v === 0);
                    }}
                  />
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                  <ControlButton
                    onClick={toggleFullscreen}
                    label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize className="size-5" />
                    ) : (
                      <Maximize className="size-5" />
                    )}
                  </ControlButton>
                  <Dialog.Close
                    aria-label="Close"
                    className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
              </div>

              {/* Fullscreen-only nav arrows (sibling arrows below are hidden by the fullscreen top layer) */}
              {hasMultiple && (
                <div className="reelink-fs-nav pointer-events-auto absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 flex-col gap-3">
                  <SideArrowButton
                    onClick={() => navigate(-1)}
                    label="Previous demo"
                    title="Previous"
                  >
                    <ChevronUp className="size-6" />
                  </SideArrowButton>
                  <SideArrowButton
                    onClick={() => navigate(1)}
                    label="Next demo"
                    title="Next"
                  >
                    <ChevronDown className="size-6" />
                  </SideArrowButton>
                </div>
              )}

              {/* Bottom scrub bar */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pt-10 pb-4 transition-opacity duration-200",
                  controlsVisible ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="pointer-events-auto flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.01}
                    value={currentTime}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value);
                      const v = videoRef.current;
                      if (v) v.currentTime = t;
                      setCurrentTime(t);
                      showControls();
                    }}
                    style={
                      { "--progress": `${progressPct}%` } as React.CSSProperties
                    }
                    className="reelink-range flex-1"
                    aria-label="Seek"
                  />
                  <span className="min-w-[72px] text-right text-xs tabular-nums text-white/90">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Editorial caption panel — hangs to LEFT of stage (lg+ only) */}
            <aside className="pointer-events-none absolute top-1/2 right-[calc(100%+2.5rem)] hidden w-72 -translate-y-1/2 flex-col gap-5 text-cream lg:flex">
              <span className="font-mono text-[10px] tracking-[0.3em] text-ochre/80 uppercase">
                N°{String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-3xl leading-[1.05] text-cream">
                <em className="font-medium">{current.title}</em>
              </h3>
              <p className="font-sans text-[15px] leading-[1.55] text-cream/70">
                {current.description}
              </p>
              <span className="mt-2 flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] text-cream/45 uppercase">
                <span className="inline-block h-px w-6 bg-cream/25" />
                {current.category}
              </span>
            </aside>

            {/* Side navigation arrows — hang to RIGHT of stage */}
            {hasMultiple && (
              <div className="absolute top-1/2 left-[calc(100%+1rem)] hidden -translate-y-1/2 flex-col gap-3 sm:flex">
                <SideArrowButton
                  onClick={() => navigate(-1)}
                  label="Previous demo"
                  title="Previous"
                >
                  <ChevronUp className="size-6" />
                </SideArrowButton>
                <SideArrowButton
                  onClick={() => navigate(1)}
                  label="Next demo"
                  title="Next"
                >
                  <ChevronDown className="size-6" />
                </SideArrowButton>
              </div>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ControlButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

function SideArrowButton({
  children,
  label,
  title,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
      className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:scale-110 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

function VolumeControl({
  muted,
  volume,
  volumePct,
  onToggleMute,
  onVolumeChange,
}: {
  muted: boolean;
  volume: number;
  volumePct: number;
  onToggleMute: () => void;
  onVolumeChange: (v: number) => void;
}) {
  return (
    <div className="group/vol flex items-center rounded-full bg-black/40 transition-colors hover:bg-black/60">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="flex size-10 items-center justify-center rounded-full text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        {muted || volume === 0 ? (
          <VolumeX className="size-5" />
        ) : (
          <Volume2 className="size-5" />
        )}
      </button>
      <div className="w-0 overflow-hidden transition-[width] duration-200 group-hover/vol:w-24 group-focus-within/vol:w-24">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          style={{ "--progress": `${volumePct}%` } as React.CSSProperties}
          className="reelink-range mx-3 w-20"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
