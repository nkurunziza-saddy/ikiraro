export interface HandPose {
  letter: string;
  motion: string;
}

export interface SignCanvas {
  setHand(letter: string, motion?: string): void;
  setOverlay(label: string, sublabel?: string): void;
  setExpression?(expression: string): void;
  setBlend?(factor: number, fromLetter: string, toLetter: string): void;
  clear(): void;
}

export interface RendererState {
  time: number;
  frameIndex: number;
  progress: number;
  isPlaying: boolean;
}

export interface PlaybackOptions {
  speed: number;
  loop: boolean;
}
