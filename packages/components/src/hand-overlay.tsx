import { useEffect, useRef } from "react";

import type { CameraTrackingState } from "@sensa/engine/vision";

const CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];
const SIGNING_GUIDE = {
  x: 0.14,
  y: 0.12,
  width: 0.72,
  height: 0.76,
} as const;

export function HandOverlay({ tracking }: { tracking: CameraTrackingState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confidence = tracking.classification?.confidence ?? 0;
  const detectedSign = tracking.classification?.sign ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    // Dynamic resolution matching
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const guideX = SIGNING_GUIDE.x * width;
    const guideY = SIGNING_GUIDE.y * height;
    const guideWidth = SIGNING_GUIDE.width * width;
    const guideHeight = SIGNING_GUIDE.height * height;

    context.strokeStyle = "rgba(148, 163, 184, 0.22)";
    context.lineWidth = 1.5;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.roundRect(guideX, guideY, guideWidth, guideHeight, 20);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "rgba(226, 232, 240, 0.72)";
    context.font = "600 11px DM Sans Variable";
    context.textAlign = "center";
    context.fillText("Keep your signing hand centered and fully visible", width / 2, guideY - 10);

    if (tracking.landmarks.length === 0) {
      return;
    }
    const isDetected = detectedSign !== null;
    const color = isDetected
      ? `rgba(255, 164, 56, ${0.45 + confidence * 0.55})`
      : "rgba(93, 211, 199, 0.35)";

    context.lineCap = "round";
    context.lineJoin = "round";
    context.setLineDash([5, 5]);
    context.lineWidth = 2.5;
    context.strokeStyle = color;
    context.shadowBlur = isDetected ? 12 : 0;
    context.shadowColor = color;
    context.beginPath();

    for (const [startIndex, endIndex] of CONNECTIONS) {
      const start = tracking.landmarks[startIndex];
      const end = tracking.landmarks[endIndex];
      if (start && end) {
        context.moveTo((1 - start.x) * width, start.y * height);
        context.lineTo((1 - end.x) * width, end.y * height);
      }
    }

    context.stroke();
    context.setLineDash([]);

    for (const index of [4, 8, 12, 16, 20]) {
      const point = tracking.landmarks[index];
      if (point) {
        context.fillStyle = color;
        context.beginPath();
        context.arc((1 - point.x) * width, point.y * height, 4.5, 0, Math.PI * 2);
        context.fill();
      }
    }

    if (isDetected && tracking.landmarks[9]) {
      const center = tracking.landmarks[9];
      const x = (1 - center.x) * width;
      const y = center.y * height - 42;
      context.shadowBlur = 0;
      context.fillStyle = "oklch(0.2 0 0 / 90%)";
      context.beginPath();
      context.roundRect(x - 22, y - 20, 44, 44, 12);
      context.fill();
      context.fillStyle = "oklch(0.98 0 0)";
      context.font = "700 24px DM Sans Variable";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(detectedSign, x, y);
      context.font = "700 10px DM Sans Variable";
      context.fillText(`${Math.round(confidence * 100)}%`, x, y + 26);
    }
  }, [confidence, detectedSign, tracking]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
