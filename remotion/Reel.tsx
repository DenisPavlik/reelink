import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
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
  imageUrl?: string;
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
  captions: [
    { word: "AI", startMs: 0, endMs: 400 },
    { word: "just", startMs: 400, endMs: 750 },
    { word: "changed", startMs: 750, endMs: 1200 },
    { word: "everything", startMs: 1200, endMs: 1900 },
    { word: "again", startMs: 1900, endMs: 2400 },
  ],
  totalDurationMs: 2400,
};

const TEXT_COLOR = "#fff";
const STROKE_COLOR = "#000";
const STROKE_WIDTH_PX = 10;
const CROSSFADE_MS = 400;
const KEN_BURNS_SCALE = 0.12;
const KEN_BURNS_PAN_PX = 30;

export function Reel({ scenes, captions, totalDurationMs }: ReelProps) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const nowMs = (frame / fps) * 1000;

  const activeIdx = findActiveCaptionIndex(captions, nowMs);
  const activeCap = activeIdx >= 0 ? captions[activeIdx] : null;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground frame={frame} totalDurationMs={totalDurationMs} fps={fps} />

      <SceneBackground
        scenes={scenes}
        totalDurationMs={totalDurationMs}
        nowMs={nowMs}
      />

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

      {activeCap && (
        <ActiveCaption
          key={activeIdx}
          word={activeCap.word}
          startMs={activeCap.startMs}
          frame={frame}
          fps={fps}
        />
      )}
    </AbsoluteFill>
  );
}

function SceneBackground({
  scenes,
  totalDurationMs,
  nowMs,
}: {
  scenes: ReelScene[];
  totalDurationMs: number;
  nowMs: number;
}) {
  return (
    <>
      {scenes.map((scene, i) => {
        if (!scene.imageUrl) return null;
        const nextStartMs = scenes[i + 1]?.startMs ?? totalDurationMs;
        const isFirst = i === 0;
        const isLast = i === scenes.length - 1;
        const sceneSpanMs = Math.max(1, nextStartMs - scene.startMs);

        const opacity = computeSceneOpacity({
          nowMs,
          startMs: scene.startMs,
          nextStartMs,
          isFirst,
          isLast,
        });
        if (opacity <= 0) return null;

        const progress = Math.max(
          0,
          Math.min(1, (nowMs - scene.startMs) / sceneSpanMs),
        );
        const scale = 1 + progress * KEN_BURNS_SCALE;
        const panDir = i % 2 === 0 ? 1 : -1;
        const translateX = panDir * progress * KEN_BURNS_PAN_PX;
        const translateY = -progress * KEN_BURNS_PAN_PX * 0.5;

        return (
          <AbsoluteFill key={i} style={{ opacity, overflow: "hidden" }}>
            <Img
              src={scene.imageUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                transformOrigin: "center",
              }}
            />
          </AbsoluteFill>
        );
      })}
    </>
  );
}

function computeSceneOpacity({
  nowMs,
  startMs,
  nextStartMs,
  isFirst,
  isLast,
}: {
  nowMs: number;
  startMs: number;
  nextStartMs: number;
  isFirst: boolean;
  isLast: boolean;
}): number {
  const fadeInStartMs = isFirst ? startMs : startMs - CROSSFADE_MS;
  const fadeOutStartMs = isLast ? nextStartMs : nextStartMs - CROSSFADE_MS;

  if (nowMs < fadeInStartMs) return 0;
  if (nowMs >= nextStartMs) return 0;
  if (nowMs < startMs) {
    return (nowMs - fadeInStartMs) / CROSSFADE_MS;
  }
  if (nowMs < fadeOutStartMs) return 1;
  return 1 - (nowMs - fadeOutStartMs) / CROSSFADE_MS;
}

function ActiveCaption({
  word,
  startMs,
  frame,
  fps,
}: {
  word: string;
  startMs: number;
  frame: number;
  fps: number;
}) {
  const wordStartFrame = Math.round((startMs / 1000) * fps);
  const sinceStart = Math.max(0, frame - wordStartFrame);
  const scale = spring({
    frame: sinceStart,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.55 },
    from: 0.55,
    to: 1,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "72%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: 144,
          fontWeight: 900,
          lineHeight: 1,
          color: TEXT_COLOR,
          textTransform: "uppercase",
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          WebkitTextStroke: `${STROKE_WIDTH_PX}px ${STROKE_COLOR}`,
          paintOrder: "stroke fill",
          filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.55))",
        }}
      >
        {word}
      </span>
    </div>
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

