"use client";

import { Button } from "@/components/ui/button";

export type VideoPlayerProps = {
  src: string;
  onReset: () => void;
};

export function VideoPlayer({ src, onReset }: VideoPlayerProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="rounded-2xl overflow-hidden border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] aspect-[9/16] bg-black">
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="w-full h-full"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1"
          render={
            <a href={src} download>
              Download mp4
            </a>
          }
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onReset}
          className="flex-1 bg-white/5 border-white/30 text-white hover:bg-white/10"
        >
          Make another
        </Button>
      </div>
    </div>
  );
}
