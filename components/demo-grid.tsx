"use client";

import { useState } from "react";

const DEMOS = [
  { src: "/demos/1.mp4", title: "Tech essay" },
  { src: "/demos/2.mp4", title: "News article" },
  { src: "/demos/3.mp4", title: "Long-form blog" },
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
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm text-center px-4">
          {title}
          <br />
          <span className="text-xs">demo coming soon</span>
        </div>
      ) : (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
