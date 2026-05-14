import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["900"] });

export type ReelCaption = {
  word: string;
  startMs: number;
  endMs: number;
};

export type ReelScene = {
  text: string;
  audioUrl: string;
  durationMs: number;
  startMs: number;
};

export type ReelProps = {
  scenes: ReelScene[];
  captions: ReelCaption[];
  totalDurationMs: number;
};

export const defaultReelProps: ReelProps = {
  scenes: [],
  captions: [],
  totalDurationMs: 1000,
};

const WINDOW_RADIUS = 2;
const ACCENT = "#5eead4";
const INACTIVE = "rgba(255, 255, 255, 0.55)";

export function Reel({ scenes, captions, totalDurationMs }: ReelProps) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const nowMs = (frame / fps) * 1000;

  const activeIdx = findActiveCaptionIndex(captions, nowMs);
  const windowed = sliceWindow(captions, activeIdx, WINDOW_RADIUS);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground frame={frame} totalDurationMs={totalDurationMs} fps={fps} />

      {scenes.map((scene, i) => {
        const fromFrame = Math.round((scene.startMs / 1000) * fps);
        const durationInFrames = Math.max(
          1,
          Math.round((scene.durationMs / 1000) * fps),
        );
        return (
          <Sequence
            key={i}
            from={fromFrame}
            durationInFrames={durationInFrames}
          >
            <Audio src={scene.audioUrl} />
          </Sequence>
        );
      })}

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0 24px",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: 900,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {windowed.map((cap, i) => {
            const isActive = cap.absoluteIdx === activeIdx;
            return (
              <span
                key={`${cap.absoluteIdx}-${i}`}
                style={{
                  fontSize: isActive ? 132 : 96,
                  fontWeight: 900,
                  color: isActive ? ACCENT : INACTIVE,
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                  transition: "all 80ms ease-out",
                  textShadow: isActive
                    ? "0 4px 24px rgba(0, 0, 0, 0.45)"
                    : "0 2px 12px rgba(0, 0, 0, 0.35)",
                }}
              >
                {cap.word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function GradientBackground({
  frame,
  totalDurationMs,
  fps,
}: {
  frame: number;
  totalDurationMs: number;
  fps: number;
}) {
  const totalFrames = Math.max(1, (totalDurationMs / 1000) * fps);
  const t = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateRight: "clamp",
  });
  const angle = 135 + t * 60;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, #022c22 0%, #064e3b 25%, #0c4a6e 55%, #064e3b 80%, #022c22 100%)`,
      }}
    />
  );
}

function findActiveCaptionIndex(
  captions: ReelCaption[],
  nowMs: number,
): number {
  if (captions.length === 0) return -1;
  for (let i = 0; i < captions.length; i++) {
    const c = captions[i];
    if (nowMs >= c.startMs && nowMs < c.endMs) return i;
    if (nowMs < c.startMs) return Math.max(0, i - 1);
  }
  return captions.length - 1;
}

function sliceWindow(
  captions: ReelCaption[],
  activeIdx: number,
  radius: number,
): Array<ReelCaption & { absoluteIdx: number }> {
  if (activeIdx < 0) return [];
  const start = Math.max(0, activeIdx - radius);
  const end = Math.min(captions.length, activeIdx + radius + 1);
  return captions.slice(start, end).map((c, i) => ({
    ...c,
    absoluteIdx: start + i,
  }));
}
