"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
export type AnimationPattern = "cursor" | "edges" | "random";
export interface PixelBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number;
  speed?: number;
  pattern?: AnimationPattern;
  darkColors?: string;
  lightColors?: string;
  size?: number;
}
interface PixelCell {
  col: number;
  row: number;
  opacity: number;
  targetOpacity: number;
  color: string;
  speed: number;
  angle?: number;
  distance?: number;
}
export function PixelBackground({
  gap = 2,
  speed = 1,
  pattern = "cursor",
  darkColors = "#0d1b4b,#1a3a8f,#2563eb",
  lightColors = "#bfdbfe,#93c5fd,#3b82f6",
  size = 16,
  className,
  children,
  ...props
}: PixelBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<PixelCell[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getColors = () => {
    if (typeof document === "undefined") return darkColors.split(",");
    const isDark =
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark");
    const colorsStr = isDark ? darkColors : lightColors || darkColors;
    return colorsStr.split(",");
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    const cols = Math.ceil(dimensions.width / (size + gap));
    const rows = Math.ceil(dimensions.height / (size + gap));
    const colors = getColors();
    const cx = cols / 2;
    const cy = rows / 2;
    const newCells: PixelCell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = c - cx;
        const dy = r - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        newCells.push({
          col: c,
          row: r,
          opacity: 0,
          targetOpacity: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 0.02 + Math.random() * 0.04,
          distance: dist,
          angle: angle,
        });
      }
    }
    cellsRef.current = newCells;
  }, [dimensions, size, gap, darkColors, lightColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;
    let time = 0;
    const render = () => {
      time += 0.02 * speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colors = getColors();
      const cells = cellsRef.current;
      const cols = Math.ceil(canvas.width / (size + gap));
      const rows = Math.ceil(canvas.height / (size + gap));

      cells.forEach((cell) => {
        if (pattern === "cursor") {
          if (mouseRef.current.active) {
            const mouseCol = Math.floor(mouseRef.current.x / (size + gap));
            const mouseRow = Math.floor(mouseRef.current.y / (size + gap));
            const distCol = cell.col - mouseCol;
            const distRow = cell.row - mouseRow;
            const distance = Math.sqrt(distCol * distCol + distRow * distRow);
            if (distance < 4) {
              const factor = (4 - distance) / 4;
              if (Math.random() < 0.15 * factor) {
                cell.targetOpacity = 0.4 + Math.random() * 0.6 * factor;
                cell.color = colors[Math.floor(Math.random() * colors.length)];
              }
            } else {
              cell.targetOpacity = Math.max(0, cell.targetOpacity - 0.02);
            }
          } else {
            cell.targetOpacity = Math.max(0, cell.targetOpacity - 0.02);
          }
        } else if (pattern === "edges") {
          const distToEdge = Math.min(cell.col, cols - 1 - cell.col, cell.row, rows - 1 - cell.row);
          const waveVal = Math.sin(time - distToEdge * 0.4);
          if (waveVal > 0.7) {
            cell.targetOpacity = ((waveVal - 0.7) / 0.3) * (0.2 + Math.random() * 0.4);
            if (cell.opacity < 0.1) {
              cell.color = colors[Math.floor(Math.random() * colors.length)];
            }
          } else {
            cell.targetOpacity = 0;
          }
        } else if (pattern === "random") {
          const angleFactor = Math.sin(cell.angle! * 3 + time * 1.5);
          const distFactor = Math.sin(cell.distance! * 0.2 - time);
          const val = angleFactor * distFactor;
          if (val > 0.6) {
            cell.targetOpacity = ((val - 0.6) / 0.4) * (0.3 + Math.random() * 0.5);
            if (cell.opacity < 0.05) {
              cell.color = colors[Math.floor(Math.random() * colors.length)];
            }
          } else {
            cell.targetOpacity = Math.max(0, cell.targetOpacity - 0.02);
          }
        }

        const diff = cell.targetOpacity - cell.opacity;
        if (Math.abs(diff) > 0.01) {
          cell.opacity += diff * cell.speed * speed;
        } else {
          cell.opacity = cell.targetOpacity;
        }

        cell.opacity = Math.max(0, Math.min(1, cell.opacity));

        if (cell.opacity > 0.01) {
          ctx.fillStyle = cell.color;
          ctx.globalAlpha = cell.opacity;
          const x = cell.col * (size + gap);
          const y = cell.row * (size + gap);
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, size, size, 2);
          } else {
            ctx.rect(x, y, size, size);
          }
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, pattern, size, gap, speed, darkColors, lightColors]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };
  const handleMouseEnter = () => {
    mouseRef.current.active = true;
  };
  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };
  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 pointer-events-none block"
      />
      <div className="relative z-10 w-full h-full pointer-events-none [&>*]:pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
