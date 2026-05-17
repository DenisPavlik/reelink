"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { ShortsPlayer, type ShortsDemo } from "./shorts-player";

const DEMOS: ShortsDemo[] = [
  { src: "/demos/1.mp4", title: "Cats vs Dogs" },
  { src: "/demos/2.mp4", title: "Dark Chocolate" },
  { src: "/demos/3.mp4", title: "Lost in Forest" },
];

export function DemoGrid() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="w-full max-w-5xl mx-auto pt-20">
      <h2 className="text-emerald-100/80 text-sm uppercase tracking-widest text-center mb-8">
        Examples
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {DEMOS.map((demo, idx) => (
          <DemoCard
            key={demo.src}
            demo={demo}
            onOpen={() => setOpenIdx(idx)}
          />
        ))}
      </div>
      <ShortsPlayer
        key={openIdx ?? "closed"}
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
        demos={DEMOS}
        startIdx={openIdx ?? 0}
      />
    </section>
  );
}

function DemoCard({ demo, onOpen }: { demo: ShortsDemo; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur aspect-[9/16] relative">
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 text-sm text-center px-4 gap-1">
          <span>{demo.title}</span>
          <span className="text-xs">demo coming soon</span>
        </div>
      ) : (
        <>
          <video
            src={`${demo.src}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
            onError={() => setFailed(true)}
          />
          <div className="absolute inset-0 bg-black/20" aria-hidden />
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Play ${demo.title}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span className="size-16 rounded-full bg-white/90 text-emerald-950 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
              <Play className="size-7 translate-x-0.5" fill="currentColor" />
            </span>
            <span className="text-white/95 text-sm font-medium drop-shadow-lg">
              {demo.title}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
