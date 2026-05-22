"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
export interface ProgressiveBlurProps extends React.HTMLAttributes<HTMLDivElement> {
  side: "top" | "bottom" | "left" | "right";
  strength?: number;
  size?: string;
  tint?: boolean;
}
export function ProgressiveBlur({
  side,
  strength = 4,
  size = "160px",
  tint = true,
  className,
  ...props
}: ProgressiveBlurProps) {
  const layers = Array.from({ length: 8 }, (_, i) => {
    const factor = (i + 1) / 8;
    const blur = strength * factor * factor * 8;

    const start = 0;
    const end = Math.round((1 - factor * 0.8) * 100);
    return {
      blur,
      start,
      end,
    };
  });

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 10,
    ...(side === "top" && { top: 0, left: 0, right: 0, height: size }),
    ...(side === "bottom" && { bottom: 0, left: 0, right: 0, height: size }),
    ...(side === "left" && { left: 0, top: 0, bottom: 0, width: size }),
    ...(side === "right" && { right: 0, top: 0, bottom: 0, width: size }),
  };
  const getGradientDirection = () => {
    switch (side) {
      case "top":
        return "to bottom";
      case "bottom":
        return "to top";
      case "left":
        return "to right";
      case "right":
        return "to left";
    }
  };
  const direction = getGradientDirection();
  return (
    <div className={cn("progressive-blur", className)} style={containerStyle} {...props}>
      {layers.map((layer, index) => {
        const mask = `linear-gradient(${direction}, rgba(0, 0, 0, 1) ${layer.start}%, rgba(0, 0, 0, 0) ${layer.end}%)`;
        return (
          <div
            key={index}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${layer.blur.toFixed(1)}px)`,
              WebkitBackdropFilter: `blur(${layer.blur.toFixed(1)}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}

      {tint && (
        <div
          className="absolute inset-0 bg-gradient-to-b"
          style={{
            backgroundImage: `linear-gradient(${direction}, var(--background, #000000) 0%, transparent 100%)`,
          }}
        />
      )}
    </div>
  );
}
