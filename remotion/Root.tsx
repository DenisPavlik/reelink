import { Composition } from "remotion";
import { Reel, type ReelProps, defaultReelProps } from "./Reel";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export function Root() {
  return (
    <Composition
      id="Reel"
      component={Reel}
      defaultProps={defaultReelProps}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={150}
      calculateMetadata={({ props }: { props: ReelProps }) => {
        const durationFrames = Math.max(
          30,
          Math.ceil((props.totalDurationMs / 1000) * FPS),
        );
        return { durationInFrames: durationFrames, fps: FPS };
      }}
    />
  );
}
