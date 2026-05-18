"use client";

export type VideoPlayerProps = {
  src: string;
  onReset: () => void;
};

export function VideoPlayer({ src, onReset }: VideoPlayerProps) {
  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[3px] border border-cream/20 bg-ink shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        />
        <span className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.25em] text-cream/85 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          Final cut
        </span>
      </div>
      <div className="flex items-center gap-6 border-t border-cream/15 pt-4 font-mono text-[11px] tracking-[0.22em] uppercase">
        <a
          href={src}
          download
          className="group/dl flex items-center gap-2 text-ochre transition-colors hover:text-cream"
        >
          <span>Download</span>
          <span
            aria-hidden
            className="inline-block transition-transform group-hover/dl:translate-y-0.5"
          >
            ↓
          </span>
        </a>
        <span className="text-cream/20">·</span>
        <button
          type="button"
          onClick={onReset}
          className="group/again flex items-center gap-2 text-cream/70 transition-colors hover:text-cream"
        >
          <span
            aria-hidden
            className="inline-block transition-transform group-hover/again:-translate-x-1"
          >
            ←
          </span>
          <span>Make another</span>
        </button>
      </div>
    </div>
  );
}
