"use client";

const URL_INPUT_ID = "article-url";
const URL_FRAME_ID = "url-form-frame";
const PULSE_CLASS = "reelink-pulse";
const PULSE_MS = 700;

export function TryButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const input = document.getElementById(
          URL_INPUT_ID,
        ) as HTMLInputElement | null;
        input?.focus();

        const frame = document.getElementById(URL_FRAME_ID);
        if (!frame) return;
        // restart the animation cleanly even on rapid re-clicks
        frame.classList.remove(PULSE_CLASS);
        void frame.offsetWidth;
        frame.classList.add(PULSE_CLASS);
        window.setTimeout(
          () => frame.classList.remove(PULSE_CLASS),
          PULSE_MS,
        );
      }}
      className="group/cta flex items-center gap-2 border border-ochre/60 px-3 py-1.5 text-ochre transition-colors hover:bg-ochre/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/60"
    >
      <span>Try</span>
      <span
        aria-hidden
        className="inline-block transition-transform group-hover/cta:translate-x-0.5"
      >
        →
      </span>
    </button>
  );
}
