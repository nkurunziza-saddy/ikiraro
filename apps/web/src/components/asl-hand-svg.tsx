import { useMemo } from "react";

type JointAngles = {
  mcp: number;
  pip: number;
  dip: number;
  spread: number;
};

type HandState = {
  thumb: JointAngles;
  index: JointAngles;
  middle: JointAngles;
  ring: JointAngles;
  pinky: JointAngles;
  wristRotation?: number;
};

const STRETCHED: JointAngles = { mcp: 0, pip: 0, dip: 0, spread: 0 };
const CURLED: JointAngles = { mcp: 95, pip: 100, dip: 50, spread: 0 };
const HALF_CURLED: JointAngles = { mcp: 45, pip: 45, dip: 20, spread: 0 };
const HOOKED: JointAngles = { mcp: 0, pip: 90, dip: 90, spread: 0 };

const LETTER_STATES: Record<string, HandState> = {
  A: {
    thumb: { mcp: 0, pip: 0, dip: 0, spread: 45 },
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  B: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: STRETCHED,
    middle: STRETCHED,
    ring: STRETCHED,
    pinky: STRETCHED,
  },
  C: {
    thumb: HALF_CURLED,
    index: HALF_CURLED,
    middle: HALF_CURLED,
    ring: HALF_CURLED,
    pinky: HALF_CURLED,
  },
  D: {
    thumb: { mcp: 45, pip: 45, dip: 20, spread: 0 },
    index: STRETCHED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  E: {
    thumb: { mcp: 90, pip: 90, dip: 45, spread: 0 },
    index: { mcp: 110, pip: 110, dip: 60, spread: 0 },
    middle: { mcp: 110, pip: 110, dip: 60, spread: 0 },
    ring: { mcp: 110, pip: 110, dip: 60, spread: 0 },
    pinky: { mcp: 110, pip: 110, dip: 60, spread: 0 },
  },
  F: {
    thumb: { mcp: 0, pip: 45, dip: 45, spread: 0 },
    index: { mcp: 90, pip: 90, dip: 45, spread: 0 },
    middle: STRETCHED,
    ring: STRETCHED,
    pinky: STRETCHED,
  },
  G: {
    thumb: STRETCHED,
    index: STRETCHED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
    wristRotation: 90,
  },
  H: {
    thumb: STRETCHED,
    index: STRETCHED,
    middle: STRETCHED,
    ring: CURLED,
    pinky: CURLED,
    wristRotation: 90,
  },
  I: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: STRETCHED,
  },
  J: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: STRETCHED,
    wristRotation: 20,
  },
  K: {
    thumb: { mcp: 0, pip: 0, dip: 0, spread: 20 },
    index: STRETCHED,
    middle: { mcp: 0, pip: 0, dip: 0, spread: 30 },
    ring: CURLED,
    pinky: CURLED,
  },
  L: {
    thumb: { mcp: 0, pip: 0, dip: 0, spread: 90 },
    index: STRETCHED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  M: {
    thumb: { mcp: 45, pip: 45, dip: 0, spread: 60 },
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  N: {
    thumb: { mcp: 45, pip: 45, dip: 0, spread: 40 },
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  O: {
    thumb: { mcp: 45, pip: 90, dip: 45, spread: 0 },
    index: { mcp: 45, pip: 90, dip: 45, spread: 0 },
    middle: { mcp: 45, pip: 90, dip: 45, spread: 0 },
    ring: { mcp: 45, pip: 90, dip: 45, spread: 0 },
    pinky: { mcp: 45, pip: 90, dip: 45, spread: 0 },
  },
  P: {
    thumb: { mcp: 0, pip: 0, dip: 0, spread: 20 },
    index: STRETCHED,
    middle: { mcp: 0, pip: 0, dip: 0, spread: 30 },
    ring: CURLED,
    pinky: CURLED,
    wristRotation: 90,
  },
  Q: {
    thumb: STRETCHED,
    index: STRETCHED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
    wristRotation: 180,
  },
  R: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: { mcp: 0, pip: 0, dip: 0, spread: 15 },
    middle: { mcp: 0, pip: 0, dip: 0, spread: -15 },
    ring: CURLED,
    pinky: CURLED,
  },
  S: {
    thumb: { mcp: 90, pip: 90, dip: 45, spread: 0 },
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  T: {
    thumb: { mcp: 45, pip: 45, dip: 0, spread: 20 },
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  U: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: { mcp: 0, pip: 0, dip: 0, spread: 5 },
    middle: { mcp: 0, pip: 0, dip: 0, spread: -5 },
    ring: CURLED,
    pinky: CURLED,
  },
  V: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: { mcp: 0, pip: 0, dip: 0, spread: 15 },
    middle: { mcp: 0, pip: 0, dip: 0, spread: -15 },
    ring: CURLED,
    pinky: CURLED,
  },
  W: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: { mcp: 0, pip: 0, dip: 0, spread: 15 },
    middle: STRETCHED,
    ring: { mcp: 0, pip: 0, dip: 0, spread: -15 },
    pinky: CURLED,
  },
  X: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: HOOKED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
  },
  Y: {
    thumb: STRETCHED,
    index: CURLED,
    middle: CURLED,
    ring: CURLED,
    pinky: STRETCHED,
  },
  Z: {
    thumb: { mcp: 90, pip: 45, dip: 0, spread: 0 },
    index: STRETCHED,
    middle: CURLED,
    ring: CURLED,
    pinky: CURLED,
    wristRotation: -30,
  },
};

const Finger = ({
  angles,
  x,
  y,
  rotation,
  scale = 1,
  color = "currentColor",
}: {
  angles: JointAngles;
  x: number;
  y: number;
  rotation: number;
  scale?: number;
  color?: string;
}) => {
  const segmentLen = 18 * scale;
  const width = 10 * scale;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation + (angles.spread || 0)})`}
      style={{ transition: "transform 0.2s ease-in-out" }}
    >
      {/* MCP segment */}
      <rect
        x={-width / 2}
        y={-segmentLen}
        width={width}
        height={segmentLen + 2}
        rx={width / 2}
        fill={color}
        transform={`rotate(${angles.mcp}, 0, 0)`}
        style={{ transition: "transform 0.2s ease-in-out" }}
      />
      <g
        transform={`translate(0, ${-segmentLen}) rotate(${angles.mcp}) translate(0, 0) rotate(${angles.pip})`}
        style={{ transition: "transform 0.2s ease-in-out" }}
      >
        {/* PIP segment */}
        <rect
          x={-width / 2}
          y={-segmentLen}
          width={width}
          height={segmentLen + 2}
          rx={width / 2}
          fill={color}
        />
        <g
          transform={`translate(0, ${-segmentLen}) rotate(${angles.dip})`}
          style={{ transition: "transform 0.2s ease-in-out" }}
        >
          {/* DIP segment */}
          <rect
            x={-width / 2}
            y={-segmentLen * 0.8}
            width={width}
            height={segmentLen * 0.8 + 2}
            rx={width / 2}
            fill={color}
          />
        </g>
      </g>
    </g>
  );
};

export function AslHandSvg({
  letter,
  className = "",
  size = 120,
}: {
  letter: string;
  className?: string;
  size?: number;
}) {
  const normalizedLetter = letter.toUpperCase();
  const state = useMemo(
    () => LETTER_STATES[normalizedLetter] || LETTER_STATES.A,
    [normalizedLetter],
  );

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 120"
        className="h-full w-full"
        style={{
          transform: `rotate(${state.wristRotation || 0}deg)`,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {/* Palm */}
        <path
          d="M 30,70 C 25,100 40,115 50,115 C 60,115 75,100 70,70 C 65,55 35,55 30,70 Z"
          fill="currentColor"
          className="text-stone-800"
        />

        {/* Fingers */}
        <Finger
          angles={state.thumb}
          x={30}
          y={85}
          rotation={-130}
          scale={1.1}
          color="currentColor"
        />
        <Finger
          angles={state.index}
          x={35}
          y={65}
          rotation={-15}
          scale={1.0}
          color="currentColor"
        />
        <Finger
          angles={state.middle}
          x={50}
          y={60}
          rotation={0}
          scale={1.05}
          color="currentColor"
        />
        <Finger angles={state.ring} x={65} y={65} rotation={15} scale={1.0} color="currentColor" />
        <Finger
          angles={state.pinky}
          x={75}
          y={75}
          rotation={30}
          scale={0.85}
          color="currentColor"
        />
      </svg>

      <div className="absolute -bottom-2 flex w-full justify-center">
        <span className="text-[10px] font-bold tracking-widest text-stone-500">
          {normalizedLetter}
        </span>
      </div>
    </div>
  );
}
