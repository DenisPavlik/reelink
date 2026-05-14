declare module "mp3-duration" {
  type Callback = (err: unknown, duration: number) => void;
  function mp3Duration(
    input: Buffer | string,
    cbrEstimate?: boolean | Callback,
    callback?: Callback,
  ): Promise<number>;
  export default mp3Duration;
}
