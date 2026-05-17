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
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Fetch theme colors
    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue("--primary").trim() || "oklch(0.205 0 0)";
    const mutedColor = style.getPropertyValue("--muted-foreground").trim() || "oklch(0.556 0 0)";
    const foregroundColor = style.getPropertyValue("--foreground").trim() || "oklch(0.145 0 0)";
    const backgroundColor = style.getPropertyValue("--background").trim() || "oklch(1 0 0)";

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

    // Visual Guide
    context.strokeStyle = mutedColor;
    context.globalAlpha = 0.2;
    context.lineWidth = 2;
    context.setLineDash([12, 8]);
    context.beginPath();
    context.roundRect(guideX, guideY, guideWidth, guideHeight, 24);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1.0;

    context.fillStyle = mutedColor;
    context.font = "bold 10px DM Sans Variable";
    context.textAlign = "center";
    context.globalAlpha = 0.6;
    context.fillText("CENTER SIGNING HAND", width / 2, guideY - 14);
    context.globalAlpha = 1.0;

    if (tracking.landmarks.length === 0) return;

    const isDetected = detectedSign !== null;
    const color = isDetected ? primaryColor : mutedColor;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;
    context.strokeStyle = color;

    if (isDetected) {
      context.shadowBlur = 10;
      context.shadowColor = color;
    }

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
    context.shadowBlur = 0;

    // Finger Tips
    for (const index of [4, 8, 12, 16, 20]) {
      const point = tracking.landmarks[index];
      if (point) {
        context.fillStyle = backgroundColor;
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        context.arc((1 - point.x) * width, point.y * height, 5, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    }

    if (isDetected && tracking.landmarks[9]) {
      const center = tracking.landmarks[9];
      const x = (1 - center.x) * width;
      const y = center.y * height - 48;

      context.fillStyle = foregroundColor;
      context.beginPath();
      context.roundRect(x - 24, y - 22, 48, 48, 12);
      context.fill();

      context.fillStyle = backgroundColor;
      context.font = "bold 24px DM Sans Variable";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(detectedSign, x, y - 2);

      context.font = "bold 10px DM Sans Variable";
      context.fillText(`${Math.round(confidence * 100)}%`, x, y + 18);
    }
  }, [confidence, detectedSign, tracking]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
