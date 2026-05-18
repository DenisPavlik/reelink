"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { ShortsPlayer, type ShortsDemo } from "./shorts-player";

const DEMOS: ShortsDemo[] = [
  {
    src: "/demos/1.mp4",
    title: "Cats vs Dogs",
    category: "Intelligence",
    description:
      "Two species. One ancient argument that's split families for decades — who is actually smarter?",
  },
  {
    src: "/demos/2.mp4",
    title: "Dark Chocolate",
    category: "Health",
    description:
      "A guilty pleasure, reconsidered. Is the daily square in your drawer really doing you any good?",
  },
  {
    src: "/demos/3.mp4",
    title: "Lost in Forest",
    category: "Field Guide",
    description:
      "What to do when the trail disappears, your phone has no signal, and the light is starting to fade.",
  },
];

// Duplicate the deck so the looped translateX(-50%) animation is seamless.
const TAPE = [...DEMOS, ...DEMOS];

export function DemoGrid() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <>
      <div className="flex h-full w-full items-stretch gap-3.5">
        <div className="reelink-perf w-3 shrink-0 opacity-55" aria-hidden />

        <div className="reelink-film-fade reelink-scroll-pause relative flex-1 overflow-hidden">
          <div className="reelink-scroll-up absolute inset-x-0 top-0 flex flex-col items-center gap-[18px]">
            {TAPE.map((demo, i) => {
              const realIdx = i % DEMOS.length;
              return (
                <DemoCard
                  key={`${demo.src}-${i}`}
                  demo={demo}
                  index={realIdx}
                  onOpen={() => setOpenIdx(realIdx)}
                />
              );
            })}
          </div>
        </div>

        <div className="reelink-perf w-3 shrink-0 opacity-55" aria-hidden />
      </div>

      <ShortsPlayer
        key={openIdx ?? "closed"}
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
        demos={DEMOS}
        startIdx={openIdx ?? 0}
      />
    </>
  );
}

function DemoCard({
  demo,
  index,
  onOpen,
}: {
  demo: ShortsDemo;
  index: number;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const number = `N°${String(index + 1).padStart(2, "0")}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={failed}
      aria-label={`Play ${demo.title}`}
      className="group/card relative aspect-[9/16] w-[190px] shrink-0 overflow-hidden rounded-md border border-cream/15 bg-ink-2 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out enabled:hover:scale-[1.06] enabled:hover:border-ochre/50 enabled:hover:shadow-[0_22px_50px_-15px_rgba(0,0,0,0.95)] disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/60 focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
    >
      {failed ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center font-mono text-[10px] tracking-[0.18em] text-cream/40 uppercase">
          <span>{demo.title}</span>
          <span className="text-cream/25">unavailable</span>
        </span>
      ) : (
        <>
          <video
            src={`${demo.src}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="pointer-events-none h-full w-full object-cover transition-[transform,filter] duration-700 group-hover/card:scale-[1.08] group-hover/card:brightness-110"
            onError={() => setFailed(true)}
          />

          {/* persistent N° badge top-left */}
          <span className="absolute top-3 left-3.5 font-mono text-[11px] tracking-[0.25em] text-cream/85 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            {number}
          </span>

          {/* dim gradient that's always there */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent transition-opacity duration-500 group-hover/card:opacity-0"
          />

          {/* slide-up info overlay (revealed on hover) */}
          <span
            aria-hidden
            className="absolute inset-0 translate-y-full bg-gradient-to-t from-ink/95 via-ink/85 to-transparent transition-transform duration-500 ease-out group-hover/card:translate-y-0"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 px-4 pb-4 opacity-0 transition-all duration-500 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100">
            {/* Centered play circle, sits above the title */}
            <div className="mb-3.5 flex justify-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-ochre/85 bg-ink/40 text-ochre backdrop-blur-sm transition-transform duration-500 group-hover/card:scale-105">
                <Play
                  className="size-4 translate-x-px"
                  fill="currentColor"
                />
              </span>
            </div>
            <h3 className="text-center font-display text-xl leading-[1.1] text-cream">
              <em className="font-medium">{demo.title}</em>
            </h3>
            <p className="mt-2 line-clamp-3 text-center font-sans text-[13px] leading-[1.45] text-cream/75">
              {demo.description}
            </p>
            <div className="mt-3.5 flex items-center justify-center gap-3 font-mono text-[10px] tracking-[0.25em] text-cream/55 uppercase">
              <span className="inline-block h-px w-4 bg-cream/25" />
              {demo.category}
              <span className="inline-block h-px w-4 bg-cream/25" />
            </div>
          </div>
        </>
      )}
    </button>
  );
}
