"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const DEMOS = [
  { src: "/demos/1.mp4", title: "Cats vs Dogs" },
  { src: "/demos/2.mp4", title: "Dark Chocolate" },
  { src: "/demos/3.mp4", title: "Lost in Forest" },
];

export function DemoGrid() {
  return (
    <section className="w-full max-w-5xl mx-auto pt-20">
      <h2 className="text-emerald-100/80 text-sm uppercase tracking-widest text-center mb-8">
        Examples
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {DEMOS.map((demo) => (
          <DemoCard key={demo.src} {...demo} />
        ))}
      </div>
    </section>
  );
}

function DemoCard({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur aspect-[9/16] relative">
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 text-sm text-center px-4 gap-1">
          <span>{title}</span>
          <span className="text-xs">demo coming soon</span>
        </div>
      ) : (
        <>
          <video
            src={`${src}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
            onError={() => setFailed(true)}
          />
          <div className="absolute inset-0 bg-black/20" aria-hidden />
          <button
            type="button"
            disabled
            aria-label={`Play ${title} (coming soon)`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 group cursor-not-allowed"
          >
            <span className="size-16 rounded-full bg-white/90 text-emerald-950 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
              <Play className="size-7 translate-x-0.5" fill="currentColor" />
            </span>
            <span className="text-white/95 text-sm font-medium drop-shadow-lg">
              {title}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
