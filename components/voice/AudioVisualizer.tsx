"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
}

export default function AudioVisualizer({ isActive }: AudioVisualizerProps) {
  const barsCount = 5;

  if (!isActive) return null;

  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-0.5 h-5"
    >
      {Array.from({ length: barsCount }).map((_, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-primary animate-bounce"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: `${Math.random() * 60 + 40}%`,
          }}
        />
      ))}
    </div>
  );
}
